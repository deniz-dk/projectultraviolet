"""Builds the site into deploy/ (Netlify runs this on every push to main).
Run locally with:  python3 build.py"""
import json
import pathlib
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
CFG = {'__SUPABASE_URL__': 'https://igdvjbgaawncwqwotvpr.supabase.co',
       '__SUPABASE_KEY__': 'sb_publishable_HOE-S1pnMel4F3ArAnr3Aw_0jx_88xq'}  # publishable key: safe to ship
LIB = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.89.0/dist/umd/supabase.js" crossorigin="anonymous"></script>'
CSS = ['base.css', 'accounts.css', 'prep.css', 'medprep.css', 'uv.css']
JS = ['core.js', 'accounts.js', 'medprep.js', 'medschools.js']  # order matters


def logo(sz, cls='logo'):
    return (f'<svg class="{cls}" width="{sz}" height="{sz}" viewBox="0 0 64 64" aria-hidden="true">'
            '<circle cx="32" cy="32" r="28" fill="none" stroke="var(--scrub)" stroke-width="5"/>'
            '<text x="32" y="43" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" '
            'style="font-stretch:112%" font-size="29" fill="var(--scrub)">uV</text></svg>')


page = (HERE / 'src' / 'template.html').read_text(encoding='utf-8')
css = '\n'.join((HERE / 'css' / f).read_text(encoding='utf-8') for f in CSS)
js = '\n'.join((HERE / 'js' / f).read_text(encoding='utf-8') for f in JS)
for k, v in CFG.items():
    js = js.replace(k, v)
parts = {'{{CSS}}': css, '{{JS}}': js, '{{SUPABASE_LIB}}': LIB, '{{BGLOGO}}': logo(64, 'bglogo'),
         '{{LOGO36}}': logo(36), '{{LOGO38}}': logo(38)}
for k, v in parts.items():
    if page.count(k) != 1:
        sys.exit(f'build: expected one {k} in template, found {page.count(k)}')
    page = page.replace(k, v)

# Catch syntax errors before they go live
check = subprocess.run(['node', '--check', '-'], input=js + '\nacctInit();uvBoot();', capture_output=True, text=True)
if check.returncode:
    sys.exit('build: JavaScript error\n' + check.stderr)

out = HERE / 'deploy'
out.mkdir(exist_ok=True)
(out / 'index.html').write_text(page, encoding='utf-8')
(out / 'preview.html').write_text(page.replace(LIB, ''), encoding='utf-8')  # Claude preview artifact: no accounts
(out / '_headers').write_text('/*\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n')
for f in (HERE / 'brand').glob('*'):
    shutil.copy(f, out / f.name)
(out / 'favicon.svg').write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0d0d0f" stroke="#a78bfa" stroke-width="5"/>'
    '<text x="32" y="43" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="27" fill="#a78bfa">uV</text></svg>')
(out / 'site.webmanifest').write_text(json.dumps({'name': 'Project UltraViolet', 'short_name': 'UltraViolet', 'start_url': '/', 'display': 'standalone',
                                                   'background_color': '#0D0D0F', 'theme_color': '#0D0D0F',
                                                   'icons': [{'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]}, indent=2))
try:
    sha = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True, cwd=HERE).stdout.strip()
except Exception:
    sha = ''
(out / 'version.txt').write_text((sha or 'unknown') + '\n')
print('built', out / 'index.html', len(page))
