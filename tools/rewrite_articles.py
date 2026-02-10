#!/usr/bin/env python3
import json
import re
from pathlib import Path
from datetime import datetime

P = Path(__file__).resolve().parents[1] / 'data' / 'articles.json'

# Small Swedish stopword list (not exhaustive) to help prioritize content words
STOPWORDS = {
    'och','att','det','som','i','på','för','med','av','en','ett','nu','har','till','om',
    'de','den','man','är','var','blev','från','alla','sina','sina','sitt','sig','fick',
    'som','än','under','över',' efter','mot','mot','redan','nu','har'
}

def normalize_spaces(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()

def remove_parentheticals(s: str) -> str:
    return re.sub(r"\s*[\(\[][\s\S]*?[\)\]]\s*", ' ', s)

def rewrite_headline(h: str, maxlen: int = 37) -> str:
    if not h:
        return h
    orig = h.strip()
    if len(orig) <= maxlen:
        return orig
    s = remove_parentheticals(orig)
    s = s.replace(' - ', ' ').replace('—', ' ').replace('–', ' ')
    s = normalize_spaces(s)

    # Try to remove common filler words while preserving order
    words = s.split()
    content_words = [w for w in words if w.lower().strip('.,:;"') not in STOPWORDS]
    candidate = ' '.join(content_words)
    if candidate and len(candidate) <= maxlen:
        return candidate

    # If candidate is still too long, try progressive prefix of content words
    use = content_words if content_words else words
    res = ''
    for i in range(1, len(use) + 1):
        t = ' '.join(use[:i])
        if len(t) > maxlen:
            break
        res = t
    if res:
        return res

    # Fallback: take the longest prefix of original words that fits
    t = ''
    for w in words:
        cand = (t + ' ' + w).strip() if t else w
        if len(cand) <= maxlen:
            t = cand
        else:
            break
    if t:
        return t

    # As last resort, truncate cleanly and avoid splitting mid-word
    return orig[:maxlen].rsplit(' ', 1)[0]

def rewrite_subheadline(s: str, maxlen: int = 122) -> str:
    if not s:
        return s
    orig = s.strip()
    if len(orig) <= maxlen:
        return orig
    # Remove parenthetical and long trailing clauses after ':' or ' - '
    t = remove_parentheticals(orig)
    t = re.split(r'[:\-—–]', t)[0]
    t = normalize_spaces(t)
    if len(t) <= maxlen:
        return t

    words = t.split()
    content_words = [w for w in words if w.lower().strip('.,:;"') not in STOPWORDS]
    candidate = ' '.join(content_words)
    if candidate and len(candidate) <= maxlen:
        return candidate

    # Otherwise, take prefix of words that fits
    out = ''
    for w in words:
        cand = (out + ' ' + w).strip() if out else w
        if len(cand) <= maxlen:
            out = cand
        else:
            break
    return out or orig[:maxlen]

def main():
    if not P.exists():
        print('articles.json not found at', P)
        return
    bak = P.with_suffix('.json.bak.' + datetime.utcnow().strftime('%Y%m%dT%H%M%SZ'))
    bak.write_text(P.read_text(encoding='utf-8'), encoding='utf-8')
    print('Backup written to', bak)

    data = json.loads(P.read_text(encoding='utf-8'))
    changed = False
    for art in data:
        h = art.get('headline')
        sh = art.get('subheadline')
        new_h = rewrite_headline(h, 37)
        new_sh = rewrite_subheadline(sh, 122)
        if new_h != h:
            print(f"Rewrite headline id={art.get('id')}:\n  '{h}' -> '{new_h}'")
            art['headline'] = new_h
            changed = True
        if new_sh != sh:
            print(f"Rewrite subheadline id={art.get('id')} (ingress):\n  '{sh}' -> '{new_sh}'")
            art['subheadline'] = new_sh
            changed = True

    # Second pass: try to repair headlines that contain ellipses or look like truncated numeric forms
    for art in data:
        h = art.get('headline','')
        if '...' in h or re.search(r'\b\d\.\.\.|\d\.\.\.$', h):
            body = (art.get('body') or '') + ' ' + (art.get('subheadline') or '')
            # find location-like phrase (capitalized word sequences)
            caps = re.findall(r"([A-ZÅÄÖ][\wÅÄÖåäö\-]{2,}(?:\s+[A-ZÅÄÖ][\wÅÄÖåäö\-]{2,})*)", body)
            # ignore common sentence-start capitalized words
            IGNORE = {'Det','En','Ett','Efter','Från','Nu','När','Alla'}
            loc = None
            for m in caps:
                if m.split()[0] in IGNORE:
                    continue
                if m.lower() in STOPWORDS:
                    continue
                # prefer multi-word matches (places like 'Hoglands park' may appear as 'Hoglands')
                if len(m) >= 4:
                    loc = m
                    break
            if not loc and caps:
                # pick first plausible capitalized token that isn't in ignore list
                for m in caps:
                    if m.split()[0] in IGNORE:
                        continue
                    loc = m
                    break

            # find numbers and year-phrases
            num_match = re.search(r"\b(\d{1,3}(?:[\s\u00A0]\d{3})?)\b", body)
            year_match = re.search(r"\b(\d{2,4})\s?år\b", body)
            first_word = (h.split() or [''])[0]
            candidate = None
            # Special handling for academic institution / anniversary
            if (('Tekniska' in body or 'Högskola' in body or 'BTH' in body) and year_match):
                year = year_match.group(1)
                # prefer abbreviation BTH when present
                inst = 'BTH' if 'BTH' in body else 'Blekinge Tekniska Högskola'
                candidate = f"{inst} firar {year} år"
            elif loc and num_match:
                num = num_match.group(1).replace('\u00A0',' ')
                candidate = f"{first_word} i {loc} lockade {num}"
            elif loc:
                candidate = f"{first_word} i {loc}"
            else:
                # fallback: take first content words to fit
                words = re.findall(r"\w+", h)
                content_words = [w for w in words if w.lower() not in STOPWORDS]
                if content_words:
                    candidate = ' '.join(content_words)[:37].strip()
                else:
                    candidate = h.replace('...', '').strip()[:37]
            candidate = normalize_spaces(candidate)
            if len(candidate) > 37:
                candidate = candidate[:37].rsplit(' ',1)[0]
            if candidate and candidate != h:
                print(f"Repair truncated headline id={art.get('id')}: '{h}' -> '{candidate}'")
                art['headline'] = candidate
                changed = True

    # Quick targeted corrections for some incorrect repairs (catch 'Det' as place etc.)
    for art in data:
        h = art.get('headline','')
        body = (art.get('body') or '') + ' ' + (art.get('subheadline') or '')
        if ' i Det ' in h or h.endswith(' i Det'):
            # try to pick a plausible place from body (prefer Hoglands, Brunnsparken, Karlshamn, Ronneby, Sölvesborg)
            places = ['Hoglands park','Hoglands','Brunnsparken','Karlshamn','Ronneby','Sölvesborg','Brunnsparken']
            found = None
            for pplace in places:
                if pplace in body:
                    found = pplace
                    break
            if found:
                num_match = re.search(r"\b(\d{1,3}(?:[\s\u00A0]\d{3})?)\b", body)
                first_word = (h.split() or [''])[0]
                if num_match:
                    num = num_match.group(1).replace('\u00A0',' ')
                    candidate = f"{first_word} i {found.split()[0]} lockade {num}"
                else:
                    candidate = f"{first_word} i {found}"
                candidate = normalize_spaces(candidate)[:37]
                print(f"Fix Det-as-place id={art.get('id')}: '{h}' -> '{candidate}'")
                art['headline'] = candidate
                changed = True

        # Fix mis-formed BTH headline like 'Blekinge i BTH lockade 35' -> 'BTH firar 35 år'
        if re.search(r'\bBTH\b', body) and re.search(r'\b\d{2,4}\b', body):
            year_m = re.search(r"\b(\d{2,4})\s?år\b", body)
            if year_m:
                year = year_m.group(1)
                candidate = f"BTH firar {year} år"
                if art.get('headline') != candidate:
                    print(f"Fix BTH anniversary id={art.get('id')}: '{art.get('headline')}' -> '{candidate}'")
                    art['headline'] = candidate
                    changed = True

    if changed:
        P.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('Updated', P)
    else:
        print('No changes needed')

if __name__ == '__main__':
    main()
