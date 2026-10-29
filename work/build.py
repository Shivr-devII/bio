from pathlib import Path
base=Path(__file__).resolve().parent.parent
work=base/'work';out=base/'outputs';out.mkdir(exist_ok=True)
text=(work/'ui.html').read_text(encoding='utf-8')
text=text.replace('/*STYLE*/','\n'.join((work/n).read_text(encoding='utf-8') for n in ['style.css','swiss.css','wizard.css','v2.css','unified.css']))
text=text.replace('/*ENGINE*/',(work/'engine.js').read_text(encoding='utf-8')).replace('/*FAMILY*/',(work/'family.js').read_text(encoding='utf-8'))
text=text.replace('/*UI*/','\n'.join((work/n).read_text(encoding='utf-8') for n in ['ui.js','live-v2.js','wizard-ui.js','family-research-ui.js','i18n.js']))
(out/'MutaSense.html').write_text(text,encoding='utf-8')
dist=work/'site'/'dist';dist.mkdir(parents=True,exist_ok=True)
(dist/'index.html').write_text(text,encoding='utf-8')
print('Built MutaSense Investigation.')
