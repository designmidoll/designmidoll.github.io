#!/usr/bin/env python3
"""
i18n 번역 상태 점검 도구
───────────────────────────────────────────────────────────
HTML(원본)과 i18n-dict.js(사전)를 대조해 아래를 알려줍니다.

  1) 낡은 번역   : 한글이 수정됐는데 영문이 옛날 그대로인 항목
  2) 미번역      : en 이 비어 있는 항목 (ENG에서 한글로 보임)
  3) 키 없는 새 글: HTML에 추가됐지만 사전에 없는 항목
  4) 유령 항목   : 사전에는 있는데 HTML에서 사라진 항목

사용법:  python3 i18n-check.py
"""
import re, json, subprocess, sys, os

FILES = {'index.html': 'home', 'nom.html': 'nom',
         'youtube.html': 'yt', 'homuscle.html': 'hm'}
HERE = os.path.dirname(os.path.abspath(__file__))


def inner_html(src, tag, pos):
    """여는 태그 끝(pos)부터 짝이 맞는 닫는 태그까지"""
    depth, i = 1, pos
    op = re.compile(r'<%s\b' % tag, re.I)
    cl = re.compile(r'</%s\s*>' % tag, re.I)
    while True:
        mo, mc = op.search(src, i), cl.search(src, i)
        if not mc:
            return None
        if mo and mo.start() < mc.start():
            depth += 1
            i = mo.end()
        else:
            depth -= 1
            if depth == 0:
                return src[pos:mc.start()]
            i = mc.end()


def load_dict():
    js = os.path.join(HERE, 'i18n-dict.js')
    out = subprocess.run(
        ['node', '-e',
         f'global.window={{}};eval(require("fs").readFileSync({json.dumps(js)},"utf8"));'
         'process.stdout.write(JSON.stringify(window.I18N_DICT))'],
        capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit('사전을 읽지 못했습니다:\n' + out.stderr)
    return json.loads(out.stdout)


def current_from_html():
    cur = {}
    for f in FILES:
        p = os.path.join(HERE, f)
        if not os.path.exists(p):
            continue
        src = open(p, encoding='utf-8').read()
        for m in re.finditer(r'<(\w+)\s+data-i18n="([^"]+)"((?:[^>"]|"[^"]*")*?)>', src):
            h = inner_html(src, m.group(1), m.end())
            if h is not None:
                cur[m.group(2)] = h.strip()
    return cur


def norm(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def main():
    D, CUR = load_dict(), current_from_html()
    stale   = [k for k in CUR if D.get(k, {}).get('en') and norm(D[k].get('koAt')) != norm(CUR[k])]
    todo    = [k for k in CUR if not D.get(k, {}).get('en')]
    missing = [k for k in CUR if k not in D]
    ghost   = [k for k in D if k not in CUR]

    print('\n═══ i18n 번역 상태 ═══\n')
    print(f'  전체 항목      : {len(CUR)}개')
    print(f'  번역 완료      : {len(CUR) - len(todo)}개')
    print(f'  미번역         : {len(todo)}개')
    print(f'  ⚠ 낡은 번역    : {len(stale)}개')
    if missing:
        print(f'  ⚠ 사전에 없음  : {len(missing)}개')
    if ghost:
        print(f'  · 유령 항목    : {len(ghost)}개 (HTML에서 삭제됨)')

    if stale:
        print('\n── 한글이 바뀌어 영문이 낡은 항목 ──')
        for k in stale:
            print(f'\n  [{k}]')
            print(f'    번역 당시 : {norm(D[k].get("koAt"))[:70]}')
            print(f'    현재 한글 : {norm(CUR[k])[:70]}')
            print(f'    현재 영문 : {norm(D[k]["en"])[:70]}')
    if missing:
        print('\n── 사전에 없는 항목 (키 추가 필요) ──')
        for k in missing:
            print(f'  {k}: {norm(CUR[k])[:60]}')
    if ghost:
        print('\n── 유령 항목 (지워도 무방) ──')
        for k in ghost:
            print(f'  {k}')
    if not (stale or missing):
        print('\n  ✅ 낡은 번역 없음 — 영문이 한글과 일치합니다.')
    print()


if __name__ == '__main__':
    main()
