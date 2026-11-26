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
JS = ['core.js', 'tabs.js', 'track.js', 'charts.js', 'accounts.js', 'admin.js', 'medprep.js', 'medschools.js', 'chances.js', 'uvnews.js', 'canada.js', 'uvmap.js', 'money.js']  # order matters


def logo(sz, cls='logo'):
    gid = f'uvlg-{cls}-{sz}'  # unique per logo: a hidden logo's gradient would blank the others
    return (f'<svg class="{cls}" width="{sz}" height="{sz}" viewBox="0 0 64 64" aria-hidden="true">'
            '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".55" stop-color="#6366f1"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs>'
            '<circle cx="32" cy="32" r="28" fill="none" stroke="url(#' + gid + ')" stroke-width="5"/>'
            '<text x="32" y="41.4" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" '
            'style="font-stretch:112%" font-size="26" fill="url(#' + gid + ')">uV</text></svg>')


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

if '</script' in js.lower():
    sys.exit('build: a script contains "</script" as text, which would end the page script early; split it up')
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
# The Sunday newsletter issues (written by the Saturday sweep) are served as /newsletter/*.json
(out / 'newsletter').mkdir(exist_ok=True)
for f in (HERE / 'newsletter').glob('*.json'):
    shutil.copy(f, out / 'newsletter' / f.name)
# Same geometry as Project Infrared's favicon (brand/icons-source.html): r27.6, stroke 6.2, bold stroked letters; uV keeps its gradient and dark centre
(out / 'favicon.svg').write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".55" stop-color="#6366f1"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs><circle cx="32" cy="32" r="27.6" fill="#0d0d0f" stroke="url(#g)" stroke-width="6.2"/>'
    '<text x="32" y="41.6" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="850" style="font-stretch:112%;paint-order:stroke" '
    'stroke="url(#g)" stroke-width="0.5" stroke-linejoin="round" font-size="26" fill="url(#g)">uV</text></svg>')
(out / 'site.webmanifest').write_text(json.dumps({'name': 'Project UltraViolet', 'short_name': 'UltraViolet', 'start_url': '/', 'display': 'standalone',
                                                   'background_color': '#0D0D0F', 'theme_color': '#0D0D0F',
                                                   'icons': [{'src': '/icon-192.png?v=3', 'sizes': '192x192', 'type': 'image/png'}, {'src': '/icon-512.png?v=3', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]}, indent=2))
try:
    sha = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True, cwd=HERE).stdout.strip()
except Exception:
    sha = ''
(out / 'version.txt').write_text((sha or 'unknown') + '\n')
print('built', out / 'index.html', len(page))
