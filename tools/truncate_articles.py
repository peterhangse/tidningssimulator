#!/usr/bin/env python3
import json
from pathlib import Path

P = Path(__file__).resolve().parents[1] / 'data' / 'articles.json'

def truncate_field(s: str, max_len: int) -> str:
    if s is None:
        return s
    s = str(s)
    if len(s) <= max_len:
        return s
    # leave room for ellipsis so final length == max_len
    if max_len <= 3:
        return s[:max_len]
    return s[: max_len - 3].rstrip() + '...'

def main():
    if not P.exists():
        print('articles.json not found at', P)
        return
    data = json.loads(P.read_text(encoding='utf-8'))
    changed = False
    for art in data:
        h = art.get('headline')
        sh = art.get('subheadline')
        new_h = truncate_field(h, 37)
        new_sh = truncate_field(sh, 122)
        if new_h != h:
            print(f"Truncate headline id={art.get('id')}:\n  '{h}' -> '{new_h}'")
            art['headline'] = new_h
            changed = True
        if new_sh != sh:
            print(f"Truncate subheadline id={art.get('id')} (ingress):\n  '{sh}' -> '{new_sh}'")
            art['subheadline'] = new_sh
            changed = True
    if changed:
        P.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('Updated', P)
    else:
        print('No changes needed')

if __name__ == '__main__':
    main()
