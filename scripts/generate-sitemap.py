"""Rebuild the sitemap from canonical pages; retain dates unless metadata is newer."""
from pathlib import Path
from datetime import date
import re,html,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
existing={}
if (root/'sitemap.xml').exists():
 for node in ET.parse(root/'sitemap.xml').getroot():
  existing[node.find('s:loc',ns).text]=node.findtext('s:lastmod',None,ns)
urls={}
for p in root.rglob('*.html'):
 if p.name.startswith('google') or 'monthly-growth-retainer' in p.parts:continue
 s=p.read_text()
 if re.search(r'name="robots"[^>]*content="[^"]*noindex',s):continue
 m=re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"',s)
 if not m:continue
 dates=re.findall(r'"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})',s)
 urls[m[1]]=max([existing.get(m[1]) or date.today().isoformat()]+dates)
(root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{html.escape(u)}</loc><lastmod>{d}</lastmod></url>\n' for u,d in sorted(urls.items()))+'</urlset>\n')
print(f'Generated {len(urls)} canonical URLs')
