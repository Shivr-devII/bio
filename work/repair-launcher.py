from pathlib import Path
import re,json,zlib,base64,textwrap
out=Path('outputs');w=Path('work')
backend=['agent-server.cjs','cloudflare.cjs','research.cjs','family.js','engine.js','content.json','agent-plan-v2.schema.json','agent-explain.schema.json']
files={'outputs/MutaSense.html':(out/'MutaSense.html').read_text(encoding='utf-8')}
for name in backend:files['outputs/MutaSense_Local/'+name]=(w/name).read_text(encoding='utf-8')
payload=base64.b64encode(zlib.compress(json.dumps(files,ensure_ascii=False).encode('utf-8'),9)[2:-4]).decode('ascii')
bootstrap=r'''@echo off
setlocal
set "MUTASENSE_SELF=%~f0"
cd /d "%~dp0"
set "MUTASENSE_NODE="
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined MUTASENSE_NODE set "MUTASENSE_NODE=%%N"
if not defined MUTASENSE_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "MUTASENSE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined MUTASENSE_NODE (
 echo Node.js is missing. Install Node.js 22 or newer from https://nodejs.org
 pause
 exit /b 1
)
if not exist "%~dp0outputs\MutaSense_Local\agent-server.cjs" goto portable
echo MutaSense: http://127.0.0.1:8765/MutaSense.html
echo Keep this window open.
"%MUTASENSE_NODE%" "%~dp0outputs\MutaSense_Local\agent-server.cjs"
pause
exit /b
:portable
echo Preparing the bundled MutaSense files...
"%MUTASENSE_NODE%" -e "const fs=require('node:fs'),p=require('node:path'),z=require('node:zlib'),os=require('node:os'),crypto=require('node:crypto');const raw=fs.readFileSync(process.env.MUTASENSE_SELF,'utf8');const data=raw.split('::MUTASENSE_PAYLOAD\r\n')[1];if(!data)throw Error('Bundled files are missing. Download the launcher again.');const files=JSON.parse(z.inflateRawSync(Buffer.from(data.replace(/\s/g,''),'base64')).toString('utf8'));const root=p.join(process.env.MUTASENSE_DATA_DIR||p.join(os.homedir(),'Documents','MutaSense'),'run-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex'));for(const [name,text] of Object.entries(files)){if(!name.startsWith('outputs/')||name.includes('..')||p.isAbsolute(name))throw Error('Invalid bundled path');const target=p.resolve(root,name);if(!target.startsWith(p.resolve(root)+p.sep))throw Error('Invalid bundled path');fs.mkdirSync(p.dirname(target),{recursive:true});fs.writeFileSync(target,text,'utf8')}console.log('Files: '+root);require(p.join(root,'outputs','MutaSense_Local','agent-server.cjs')).server.listen(Number(process.env.MUTASENSE_PORT||8765),'127.0.0.1',()=>console.log('MutaSense: http://127.0.0.1:'+(process.env.MUTASENSE_PORT||8765)+'/MutaSense.html'));"
pause
exit /b
::MUTASENSE_PAYLOAD
'''
(out/'Start MutaSense.cmd').write_bytes(bootstrap.replace('\n','\r\n').encode('ascii')+('\r\n'.join(textwrap.wrap(payload,76))+'\r\n').encode('ascii'))
guide="""MutaSense 使用说明

启动
下载 MutaSense_Source.zip，右键选“全部解压”，打开里面的文件夹，
双击 Start MutaSense.cmd。启动窗口先不要关。
浏览器打开 http://127.0.0.1:8765/MutaSense.html。

直接在 ZIP 里双击也可以：新版启动器自己带着网页和后端文件，
会把它们放到用户文件夹下的 Documents/MutaSense，再启动。
它不再找那个缺失的 .ps1 文件。
电脑需要 Node.js 22 或更新版本。没有的话，去 nodejs.org 安装。
这台电脑也可以使用 Codex 自带的 Node.js。

语言
右上角选 English 或中文。每次打开默认英语。
切换不会清空 DNA、家系或查询结果。
论文标题、作者、基因名称保留原文。中文界面下的新解释会请求模型用中文回答。

第一次试用
保留 Sickle-cell / HBB 示例，按底部按钮往下走：
1. Input DNA / 输入 DNA：点 Analyze sequences / 分析序列。
2. Sequence evidence / 序列证据：看看哪个碱基变了，也可切换 RNA 和蛋白质。
3. Family study / 家系研究：可载入虚构家系，或直接跳过。
4. Research evidence / 研究资料：查 HBB、c.20A>T；不需要时取消勾选。
5. Evidence review / 证据复核：点 Generate explanation / 生成解释。
6. Conclusion / 结论：读解释、点引用，可继续提问或导出报告。

连接模型
点右上角 Model connection / 模型连接。
用本地 Codex：需要这台电脑已经登录 Codex。
用 Cloudflare：填 Account ID 和自己的 Workers AI token。
点 Test connection，成功后点 Use connection。
模型是 @cf/qwen/qwen3.8-27b。
Token 只留在本地服务内存，关掉服务后需要重新填。
别把 token 写进报告或分享的源码里。
只想看计算结果，可以选 Sequence computation only，不用连接模型。

家系
点 Load fictional HBB family 载入示例。
展开 Edit members and relationships，修改成员和父母关系，图会跟着变。
也可以输入一道虚构家系题目，点 Generate & explain。
不知道的基因型选 Unknown，不用猜。
一段 DNA 不会告诉网站家庭有哪些人；家系事实要另外提供。

遇到问题
网页打不开：检查启动窗口还在不在，地址是不是 127.0.0.1:8765。
端口被占用：可能已经启动了，先试着打开网页，不要再开第二个服务。
模型没回答：检查连接。Codex 有时要等几分钟，Cloudflare 会逐步显示答案。
改了输入：重新分析和生成解释，不沿用旧结论。
刷新会重置输入，想保留的报告和家系图先导出。
只双击 MutaSense.html 可以离线计算；模型和数据库查询需要本地服务。

修改源码
work/ui.html 是页面模板，work/unified.css 是最后覆盖的样式。
work/i18n.js 是界面翻译。
work/engine.js 负责 DNA 计算，work/family.js 负责家系。
work/agent-server.cjs 是后端。
在项目文件夹运行 python work/build.py，生成 outputs/MutaSense.html。
改后端后，要把对应文件复制到 outputs/MutaSense_Local，再重启服务。
普通使用不需要 Python，也不需要 npm install。

请使用示例或合成序列、虚构家系。这是课堂演示，不用来做疾病诊断。
"""
(out/'MutaSense_新手指南.txt').write_text(guide,encoding='utf-8-sig')
p=w/'deliver-source.py';s=p.read_text(encoding='utf-8')
s=s.replace("'family-research-ui.js','engine.js'","'family-research-ui.js','i18n.js','engine.js'")
s=re.sub(r'guide=""".*?"""',"guide=(out/'MutaSense_新手指南.txt').read_text(encoding='utf-8-sig')",s,flags=re.S)
s=re.sub(r"\(stage/'启动 MutaSense\.cmd'\)\.write_text\(.*?\n","shutil.copy2(out/'Start MutaSense.cmd',stage/'Start MutaSense.cmd')\nshutil.copy2(out/'Start MutaSense.cmd',stage/'启动 MutaSense.cmd')\n",s)
s=s.replace("included=[stage/'新手指南.txt',stage/'启动 MutaSense.cmd']","included=[stage/'新手指南.txt',stage/'Start MutaSense.cmd',stage/'启动 MutaSense.cmd']")
p.write_text(s,encoding='utf-8')
p=w/'package.py';s=p.read_text(encoding='utf-8').replace("'Start MutaSense.ps1']","'Start MutaSense.ps1','Start MutaSense.cmd']");p.write_text(s,encoding='utf-8')
print('Created a self-contained launcher with embedded app files and a short guide.')

