# MutaSense 使用说明

打开 http://127.0.0.1:8765/MutaSense.html。启动时双击压缩包根目录的 **Start MutaSense.cmd** 并保持窗口开启。电脑需要 Node.js 22 或更新版本。右上角可切换 English / 中文，每次打开默认英语。

## 连接自己的 Cloudflare Workers AI

点击右上角 **Model connection**，选择 **Cloudflare Workers AI**。填入 **Account ID** 与 **Workers AI API token**，点击 **Test connection**，成功后使用该连接。模型固定为 `@cf/qwen/qwen3.8-27b`。Account ID 和 token 是两个不同的值。

Token 只保存在本地服务内存中，不写入网页、文件、报告或浏览器存储。重启服务后需要重新输入，也可以点击 **Forget token**。请直接在本地网页的密码输入框里粘贴，不要把 token 写到演示文档或聊天中。实际请求会使用你的 Cloudflare 账户。

也可选择已有的 **Local Codex** 登录连接。Cloudflare 可流式显示解释；Codex 连接按完整答案块返回，可能需要几分钟。工具执行记录和公开解释会显示，模型的私有思考过程不会显示。

## 六步统一调查和实时追问

**Input DNA → Sequence evidence → Family study → Research evidence → Evidence review → Conclusion**。每次只显示当前一步。先计算序列，再补充可选的家系事实和研究主题，最后启动 AI 综合调查。上方的调查摘要共用同一次序列、家庭和研究上下文；后退或点已完成的步骤会保留输入。修改证据后要重新生成 AI 解释。生成时显示 Working…、阶段和已用时间。新增 **Investigation notebook** 可追问；生成中提交的追问进入队列，当前回答结束后继续。**Stop generation** 可停止当前请求并保留已经显示的文本。

引用如 **[S1]** 可打开来源。**Export report** 包含序列证据、解释、追问记录、家系数据和引用，不含 token。

## 家系图的两种方式

在调查的第 3 步 **Family study** 手动增加成员、选择性别和基因型、连接生物学父母，家系图立即更新。或者在描述框输入课堂题目，再点击 **Generate & explain**，真实模型调用家系工具。

默认不把一段 DNA 推断成家庭信息。可以载入虚构 HBB 家系演示。A 为参考等位基因，a 为课堂选定的变异等位基因。常染色体隐性 Aa × Aa 对每次妊娠分别为 AA 25%、Aa 50%、aa 25%，不代表兄弟姐妹必须按这个比例出生。未知基因型保持未知；简单孟德尔模型下不一致的输入会提示。可导出 SVG。

## 专业案例与数据库

调查的第 4 步 **Research evidence** 提供 HBB、CFTR 和 BRCA1 案例，并真实查询 **NCBI ClinVar** 与 **Europe PMC 的 PubMed 索引论文**。展示记录版本、分类和审核状态、文献题目、作者、年份、DOI、检索时间及来源链接，可导出 citations。该步骤的 gene / variant 也会用于 AI 的真实检索。选择专业案例会更换研究主题，不会替换 DNA；AI 会在解释前重新获取可验证来源。家系可以留空，文献研究可以取消勾选。

检索的是记录和摘要片段，不是全文综述。相关论文或同一基因的记录不等于输入序列的确定匹配。网络失败会标明，不会伪造检索结果。MutaSense_Research_Citations.md 是本次实际检索的日期快照。

## 离线与换电脑

直接打开 **MutaSense.html**，选择 **Sequence computation only** 可以离线计算，家系编辑和概率也可离线使用。AI 和数据库检索需要本地服务及联网。换电脑需要 Node.js；Cloudflare 路线不需要 Codex，Codex 路线需要有效登录。

## 研究资料

- MutaSense_Research_Citations.md：真实查询得到的专业案例与引用快照。

这是课堂项目，使用虚构家系和预设或合成序列；不能用于临床诊断或个人遗传风险评估。

网页仅包含 Investigation 六步调查。模型连接、家系生成、研究检索和追问功能保留。第 5 步点击 Generate explanation 开始模型复核。
