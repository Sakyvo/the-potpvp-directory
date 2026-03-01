## 序

***“道在迩而求诸远，事在易而求之难***”


慨锅打架圈子蒸了十年还没死，又叹圈子之松散分立之洼地原罪。最绷的无疑是灵光一闪想找个东西结果便是从b翻到yt烧干了流量与时间，指望everything本地搜索则更为野蛮，文明世界知识库你在哪。每回首22年植吧考察之往事，见“技术圈”之文档罗列，秩序井然，不觉深深之自卑......

故今整前人之述，统各界资料于一文，作个导航站一样的玩意把拂晓神键ctrl+f唤回来，望小资历少走弯路，老资历少摔键盘。






~~懒逼Sakyvo我操你妈，你几把填坑天经地义的还找上补了是吧（~~
![image](/images/img_1772374093353_c06h.png)





Menu

序

Part 1. Intro
1.1. Clients
1.2. Packs
1.3. Servers
1.4. Tools

Part 2. In-Game
2.1. Tutorials
2.2. Whenever Whatever Whoever
2.3. Appreciation!

Part 3. Video
3.1. OBS
3.2. Vegas
3.3. Smoothie
3.4. Photoshop
3.5. Credits

Part 4. Outra
4.1. Nation
4.2. Culture
4.3. Fate
4.4. Never is enough!

结



---
## Part 1. Intro

### 1.1. Clients

不同颜色文字之意: <span style="background-color:rgb(249, 237, 166)">重要</span> <span style="color:rgb(163, 224, 67)">优势 </span><span style="color:rgb(255, 0, 0)">挑刺</span> <span style="color:rgb(150, 111, 231)">锐评</span>

<span style="background-color:rgb(249, 237, 166)">缺点＞优点。即使你很喜欢某个端的优势部分，但如果其缺点无法接受，还是建议换成最“不痛”的那个。至少目前没有一款能使所有人都满意的Client</span>

[patcher]: 本指sk1er的mod [Patcher](https://sk1er.club/mods/patcher) for 1.8.9 / 1.12.2。这里把语义缩小，仅指“修复材质包读取时内存溢出问题bug”这一模块。
```
原文: Optimized Resource Pack Discovery. When using more than 50 resource packs, the screen to view them may take a while. This should now be much quicker. (Credits: Moulberry)
```


有patcher - 材质包秒读取
无patcher - 材质包＞300时读取逐渐缓慢，指数增长


Q: 太长不看，怎么选
A:
![image](/images/img_1772374097235_pjjs.png)


Q: 后门?
<span style="background-color:rgb(249, 237, 166)">A: 所有端都没有后门。但你硬要觉得有那我希望它真有</span>



##### 1.1.1. 维护中

这一分组保持着更新，但无一例外存在“对笔者而言极其恶劣的bug”，虽然将来有被修复之可能¿
<span style="background-color:rgb(249, 237, 166)">此分组均包含patcher</span>



Lunar Client: [https://www.lunarclient.com](https://www.lunarclient.com/)
<span style="color:rgb(163, 224, 67)">Mod最充足，社交优势，hcf服务器自动适配</span>
<span style="color:rgb(255, 0, 0)">史山代码，材质包mcmeta文件unicode字符会导致读取失败，材质包选定后随机性加载失败，进服时的logging in速度死慢还不能disconnect</span>


Celestial (3rd party LC launcher): [https://codeberg.org/earthsworth/celestial/releases/latest](https://codeberg.org/earthsworth/celestial/releases/latest)
[https://t.me/qbychannel](https://t.me/qbychannel)
or 798082966 qq group
<span style="color:rgb(163, 224, 67)">LC上位，相比LC启动更快 (慢于cb)，免费饰品 & Freelook & NoClickDelay etc.</span>
<span style="color:rgb(255, 0, 0)">折腾起来麻烦，LC客户端内的bug它也有。另外开发者做的是启动器而非客户端，别指望他们修LC客户端bug</span>


CheatBreaker Net: [https://cheatbreaker.net](https://cheatbreaker.net/download)
<span style="color:rgb(163, 224, 67)">优化好，免费饰品，交互丝滑，menu blur舒适</span>
<span style="color:rgb(255, 0, 0)">下载慢，身份验证bug: 启动/关闭游戏加速器后session会掉 </span><span style="color:rgb(255, 0, 0);background-color:rgb(249, 237, 166)">(有的人可能没有? 没有的话基本是最佳选择了)</span>



##### 1.1.2. 无维护

这一分组没有Developer维护，意味着不会更新，且存在无法弥补的缺点。但之所以放在这里，是由于其优点相比第一组里的各种史山，太耀眼，，，



Tellinq CheatBreaker-2_f87fb83/master [1.7.10]: [https://sakyvo.lanzouu.com/igU9y1mpiebc](https://sakyvo.lanzouu.com/igU9y1mpiebc)
<span style="color:rgb(163, 224, 67)">合并前最新的cb2。有patcher，优化好，极速启动</span>
<span style="color:rgb(255, 0, 0)">材质包bug : 无pack.png的材质包，客户端启动时不会第一时间显示，需等待约10min；游戏运行时向resourcepack文件夹中热添加pack时，也需等待10min刷新</span>
<span style="color:rgb(255, 0, 0)">无中文输入，中文输入法下按键盘会直接崩端</span>
<span style="color:rgb(255, 0, 0);background-color:rgb(249, 237, 166)">所有cb2都无饰品</span>


Tellinq CheatBreaker-2_9594402/master [1.7.10]: [https://www.mediafire.com/file/5ihdp395pf8h85z/CheatBreaker-1.7.10-Hyperpop.7z/file](https://www.mediafire.com/file/5ihdp395pf8h85z/CheatBreaker-1.7.10-Hyperpop.7z/file)
<span style="color:rgb(163, 224, 67)">Hyperpop牢大认证版本</span>
<span style="color:rgb(255, 0, 0)">旧一点的cb2，优缺点大差不差</span>
<span style="color:rgb(255, 0, 0)">Real Time Clock不能显示秒，且显示的是中文 上午/下午 而非 AM./PM.</span>


Tellinq CheatBreaker-2 [1.8.9]: [https://sakyvo.lanzouu.com/iul8S21bzq5g](https://sakyvo.lanzouu.com/iul8S21bzq5g)
<span style="color:rgb(163, 224, 67)">有patcher，优化好，简约(对1.8而言)；自带Freelook, </span><span style="color:rgb(163, 224, 67);background-color:rgb(249, 237, 166)">NoClickDelay</span>
<span style="color:rgb(255, 0, 0)">材质包bug: 同1.7</span>
<span style="color:rgb(255, 0, 0)">无中文输入，但切中文不会崩端</span>


MMC Client (skid cb2) [1.7.10]: [https://sakyvo.lanzouu.com/iKDq60j83xmb](https://sakyvo.lanzouu.com/iKDq60j83xmb)
<span style="color:rgb(150, 111, 231)">同1.7 cb2；喜欢purple theme就换这个</span>


CheatBreaker-last-legacy [1.7.10]: [https://www.mediafire.com/file/w50f0wfadoh74rn/](https://www.mediafire.com/file/w50f0wfadoh74rn/)
<span style="color:rgb(163, 224, 67)">更旧的cb2，功能跟最新cb2差不多，没有材质bug</span>
<span style="color:rgb(255, 0, 0)">但没patcher</span>


CheatBreaker-Legacy [1.7.10]: [https://www.mediafire.com/file/llvn68mslbt5j5l/](https://www.mediafire.com/file/llvn68mslbt5j5l/)
<span style="color:rgb(150, 111, 231)">同上，但还要旧</span>


CheatBreaker Plus [1.7.10]: [https://www.mediafire.com/file/ls5y64chw639elt/](https://www.mediafire.com/file/ls5y64chw639elt/)
or
[https://www.mediafire.com/file/4oaq1a9dmd79bcv](https://www.mediafire.com/file/4oaq1a9dmd79bcv)
<span style="color:rgb(163, 224, 67)">功能跟最新cb2差不多，支持LC Alpha theme</span>
<span style="color:rgb(255, 0, 0)">无patcher，无饰品，gui界面左下角有大大的cbplus logo</span>


Protocol CheatBreaker-1.6.25 [1.7.10]: [https://www.mediafire.com/file/40uzwkfeznczmj6](https://www.mediafire.com/file/40uzwkfeznczmj6/CheatBreaker_Protocol.7z/file)
<span style="color:rgb(163, 224, 67)">优化好，极速启动，极简界面</span>
<span style="color:rgb(255, 0, 0)">无patcher，动态模糊为old blur。</span>[protocol.rip](http://protocol.rip)<span style="color:rgb(255, 0, 0)">倒闭后饰品和好友功能不再可用</span>
<span style="color:rgb(150, 111, 231)">个人认为这个端可以作为CB 2018的全面上位</span>


Lunar Client - Offline: 献给配得上的人
-
LCQT v1.x: [https://github.com/Youded-byte/lunar-client-qt](https://github.com/Youded-byte/lunar-client-qt)
前置启动器
-
v2.17.7-2447: [https://pastefy.app/s4ePMPN0](https://pastefy.app/s4ePMPN0)
Lunar 2025暑期版本，Rewind更新前，没有材质包bug
-
c888646/master:
Lunar 2022:
-
<span style="color:rgb(163, 224, 67)">相比现代LC史山更少</span>
<span style="color:rgb(255, 0, 0)">拆东墙补西墙&折腾麻烦</span>
<span style="color:rgb(150, 111, 231)">约2021年12月以后的版本都有patcher</span>


LCQT v2.5.0: [https://codeberg.org/Candicey/2TQCL](https://codeberg.org/Candicey/2TQCL)
<span style="color:rgb(150, 111, 231)">被DMCA砸似了，有无人能给它复活的</span>



##### 1.1.3. 收藏品

上古老端，收藏价值＞使用价值，只建议录特定视频时使用得到特定观感
<span style="background-color:rgb(249, 237, 166)">以下所有客户端均无patcher</span>


MineHQ CheatBreaker-2017 [1.7.10]: [https://sakyvo.lanzouu.com/iPAid16gm7sb](https://sakyvo.lanzouu.com/iPAid16gm7sb)
密码:9bue
<span style="color:rgb(163, 224, 67)">FPS很高</span>，<span style="color:rgb(255, 0, 0)">无动态模糊，中文会乱码</span>


CheatBreaker_b302ec0 [1.7.10]: [https://www.mediafire.com/file/fdg3ywyi9jtcz3q/](https://www.mediafire.com/file/fdg3ywyi9jtcz3q/)
<span style="color:rgb(163, 224, 67)">0424 & 抗火药儿 双重认证</span>
<span style="color:rgb(150, 111, 231)">cb2018换上lunar alpha的背景罢了</span>


Arcane Client [1.7.10]: [https://www.mediafire.com/file/zr47umejg38y6w9/](https://www.mediafire.com/file/zr47umejg38y6w9/)
<span style="color:rgb(163, 224, 67)">cb2018换皮，无敌配色好看到炸</span>


RookieGod CheatBreaker [1.7.10]: [https://www.mediafire.com/file/efzv4jdsixkslrf/](https://www.mediafire.com/file/efzv4jdsixkslrf/)
<span style="color:rgb(163, 224, 67)">国人魔改cb2017，有</span><span style="color:rgb(163, 224, 67);background-color:rgb(249, 237, 166)">Xray</span>，<span style="color:rgb(255, 0, 0)">但存在各种渲染bug材质错乱</span>


OCMC-Green [1.7.10]: [https://sakyvo.lanzouu.com/inoJN0if4wlg](https://sakyvo.lanzouu.com/inoJN0if4wlg)
<span style="color:rgb(163, 224, 67)">3s极速启动</span>


J3Ultimate [1.7.10]: [https://www.mediafire.com/file/l9756gh30gom20v/](https://www.mediafire.com/file/l9756gh30gom20v/)
<span style="color:rgb(150, 111, 231)">西语神端，恐吓拉美人利器</span>


Zonix Client [1.7.10]: [https://sakyvo.lanzouu.com/iLw2K0rsjwcj](https://sakyvo.lanzouu.com/iLw2K0rsjwcj)
<span style="color:rgb(255, 0, 0)">傻逼端，又掉帧又丑</span>

Ninja Client [1.7.10]: [https://www.mediafire.com/file/ijhko09thaqfk4g/](https://www.mediafire.com/file/ijhko09thaqfk4g/)
<span style="color:rgb(150, 111, 231)">Zonix换皮</span>

Kihar Client [1.7.10]: [https://www.mediafire.com/file/qo9wknq5xby6wmw/](https://www.mediafire.com/file/qo9wknq5xby6wmw/)
<span style="color:rgb(150, 111, 231)">Zonix换皮，有一个空壳staff module可以装逼</span>


Lunar Client Alpha [1.7.10]: [https://www.mediafire.com/file/yxgdgrry2mezwj7/](https://www.mediafire.com/file/yxgdgrry2mezwj7/)
<span style="color:rgb(150, 111, 231)">cb2018换皮，仅支持Mojang账户登录故需要搭配外置登录器</span>


Lunar Client Alpha [1.8.9]: [https://www.mediafire.com/file/6tmdc5w3bxbo1g4/](https://www.mediafire.com/file/6tmdc5w3bxbo1g4/)
<span style="color:rgb(150, 111, 231)">美国纪狗Bloje认证。2020年的lc 1.8，没有click delay，仅支持Mojang账户登录故需要搭配外置登录器</span>


Lunar Client Lite [Launcher]: [https://sakyvo.lanzouj.com/iyYVX01qrwkh](https://sakyvo.lanzouj.com/iyYVX01qrwkh)
密码: LCL
<span style="color:rgb(255, 0, 0)">空壳，只有启动器，啥也启动不了</span>


---
### 1.2. Packs

pack，和它周边的东西
在此再次提醒@我和akane问材质之前请先翻kpf


##### 1.2.1. 一步登天

Jewdah: [https://www.bilibili.com/video/BV1tN411d7C9/](https://www.bilibili.com/video/BV1tN411d7C9/)
aio: [http://www.mediafire.com/file/3mynzut9trw3mwl/pack_folder.zip/file](http://www.mediafire.com/file/3mynzut9trw3mwl/pack_folder.zip/file)
重装系统懒得下？三拜犹大直接开砍


Stimpy 2020: [https://www.youtube.com/watch?v=WuXTSvVmHDk](https://www.youtube.com/watch?v=WuXTSvVmHDk)
aio: [http://www.mediafire.com/file/z22rpa2yo4b0rmr/2020_pack_folder_1-27-2020.zip/file](http://www.mediafire.com/file/z22rpa2yo4b0rmr/2020_pack_folder_1-27-2020.zip/file)
ind: [https://pastebin.com/L2cvw90s](https://pastebin.com/L2cvw90s)
<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">传世经典，下材质❎ - 趁弹幕没有小学生发表睿智言论爽看Stimpy Combo ✅</span>

<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">Stimpy 2022: </span>[https://www.bilibili.com/video/av115920865336722](https://www.bilibili.com/video/av115920865336722)
aio: [https://www.mediafire.com/file/ajebwyv4yoj3q2d/stimp+PACK+FOLDER+2022.zip/file](https://www.mediafire.com/file/ajebwyv4yoj3q2d/stimp+PACK+FOLDER+2022.zip/file)
旧活新整


<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">Kyeick: </span>[https://www.bilibili.com/video/av248107143](https://www.bilibili.com/video/av248107143)
aio: [DEAD, 在此批一个眼红的]
ind: [https://pastebin.com/Y1TqE13q](https://pastebin.com/Y1TqE13q)
重量级，鸡选天天读，功力日日深



##### 1.2.2. FAME

###### I. AD

“允许我打点广告”

Sakyvo 2024 (我还不FAME吗?): [https://www.123684.com/s/uCWJjv-wL6N3](https://www.123684.com/s/uCWJjv-wL6N3)
蓝奏云(不定期更新): [https://www.lanzn.com/b02e6bhzg](https://www.lanzn.com/b02e6bhzg)
密码: pack (有的材质第一个里没有)
Q群2022遗留pack: [https://www.mediafire.com/folder/u4rnsxc8hwbdv/](https://www.mediafire.com/folder/u4rnsxc8hwbdv/)
Q群2022遗留overlay: [https://www.mediafire.com/folder/q88yrv5x6hdz5/](https://www.mediafire.com/folder/q88yrv5x6hdz5/)


<span style="background-color:rgb(255, 255, 255);font-size:11pt">yungsaphars: </span>[https://www.bilibili.com/video/av96756008](https://www.bilibili.com/video/av96756008)
ind:[https://pastebin.com/ZkkaiXgk](https://pastebin.com/ZkkaiXgk)
aio: [http://www.mediafire.com/file/wx6xh7vu70hobrt/yung_pack_folder.zip/file](http://www.mediafire.com/file/wx6xh7vu70hobrt/yung_pack_folder.zip/file)
爹


Zefew
THE BEST OF ZEFEWS PACK BUNDLES: [https://pastebin.com/TBT05awc](https://pastebin.com/TBT05awc)
ind: [https://pastebin.com/TBT05awc](https://pastebin.com/TBT05awc)
-
Im the best (Pack Bundle) [Frozen]: [https://www.bilibili.com/video/av23480664](https://www.bilibili.com/video/av23480664) (超级好看必看)
ind: [https://pastebin.com/5kdMZbQX](https://pastebin.com/5kdMZbQX)
-
3k: [https://www.bilibili.com/video/av210904764](https://www.bilibili.com/video/av210904764)
ind: [https://emt.lanzoup.com/b01d51ngf](https://emt.lanzoup.com/b01d51ngf)
密码: b1b1
-
2025: [https://www.bilibili.com/video/av115427917171396](https://www.bilibili.com/video/av115427917171396)
ind: [https://www.mediafire.com/folder/9voovnagnjkp0/Packs](https://www.mediafire.com/folder/9voovnagnjkp0/Packs)
or: [https://emt.lanzouq.com/b0mc2gqti](https://emt.lanzouq.com/b0mc2gqti)
密码: f9kg
-
我最香草的pvper——1st: Zefew



###### II. Basic

“众将化身为一”

PuffedUP: [https://www.bilibili.com/video/av974484330](https://www.bilibili.com/video/av974484330)
ind: [https://4everluvu.lanzoui.com/b010nu7re](https://4everluvu.lanzoui.com/b010nu7re)
密码: b4g8
aio: [https://www.mediafire.com/file/e7x3g3yhl2lp8r0/resourcepacks.zip/file](https://www.mediafire.com/file/e7x3g3yhl2lp8r0/resourcepacks.zip/file)
21年经典风格，一键回到方块人活时代


Tye3315
-
PotPvP Pack Folder | (40+ Packs + Private Packs): [https://.wwwyoutube.com/watch?v=s9XUVxVJbVM](https://.wwwyoutube.com/watch?v=s9XUVxVJbVM)
ind: [https://pastebin.com/RneHNtXE](https://pastebin.com/RneHNtXE)
-
Private Pack Bundle Release | Lunar Cape Giveaway: [https://.wwwyoutube.com/watch?v=0mvAN6UozCc](https://.wwwyoutube.com/watch?v=0mvAN6UozCc)
ind: [https://pastebin.com/Wgx1WywT](https://pastebin.com/Wgx1WywT)
-
3k | Pack Folder Release: [https://.wwwyoutube.com/watch?v=cJW1TAgkFX8](https://.wwwyoutube.com/watch?v=cJW1TAgkFX8)
ind: [https://pastefy.app/dkAYcNLM/raw](https://pastefy.app/dkAYcNLM/raw)
-
Pack Bundle #1 (Private Packs): [https://.wwwyoutube.com/watch?v=KL9yE0hzRaQ](https://.wwwyoutube.com/watch?v=KL9yE0hzRaQ)
ind: [https://pastebin.com/SDjzzz2s](https://pastebin.com/SDjzzz2s)
-
5k Pack Bundle Release: [https://www.youtube.com/watch?v=mga6cxsDVUQ](https://www.youtube.com/watch?v=mga6cxsDVUQ)
ind: [https://pastebin.com/tpwe18yz](https://pastebin.com/tpwe18yz)
-
优质原创&量大管饱


ByRez pf: [https://www.bilibili.com/video/av668719976](https://www.bilibili.com/video/av668719976)
ind: [https://www.mediafire.com/folder/0cokcllic1yzs/ByRez%27s_Pack_Folder](https://www.mediafire.com/folder/0cokcllic1yzs/ByRez%27s_Pack_Folder)
alio: [http://www.mediafire.com/file/16sycguizhdwh0g/ByRez%2527s_Pack_Folder.rar/file](http://www.mediafire.com/file/16sycguizhdwh0g/ByRez%2527s_Pack_Folder.rar/file)
-
ByRez pb#3: [https://www.bilibili.com/video/av981948918](https://www.bilibili.com/video/av981948918)
aio: [https://www.mediafire.com/file/roqfjwbij5506bl/PotPvP_Pack_Folder_Release_%255B31_packs%255D.rar/file](https://www.mediafire.com/file/roqfjwbij5506bl/PotPvP_Pack_Folder_Release_%255B31_packs%255D.rar/file)
-
Gang Gang Gang，多为暗色系


Adviser 2017: [https://www.youtube.com/watch?v=GviURBvtPcU](https://www.youtube.com/watch?v=GviURBvtPcU)
ind: [https://www.mediafire.com/folder/tnubglc3a0lj2/Adviser's_Pack_Folder_Release](https://www.mediafire.com/folder/tnubglc3a0lj2/Adviser's_Pack_Folder_Release)
aio: [http://www.mediafire.com/file/x66ufy7rq7o6s1n/(ALL_IN_ONE)_Adviser_Resource_Pack_Folder_Release.zip](http://www.mediafire.com/file/x66ufy7rq7o6s1n/(ALL_IN_ONE)_Adviser_Resource_Pack_Folder_Release.zip)
-
Adviser 2020: [https://www.bilibili.com/video/av839715453](https://www.bilibili.com/video/av839715453)
ind: [https://www.mediafire.com/folder/r4jetefz94w7a/Adviser%27s_Pack_Folder_Release_V2_(25k_special!](https://www.mediafire.com/folder/r4jetefz94w7a/Adviser%27s_Pack_Folder_Release_V2_(25k_special!)
Exposed之神严选


Bhoze (aka 2017年35个最经典的材质包): [https://www.bilibili.com/video/av699982532](https://www.bilibili.com/video/av699982532)
ind: [https://pastebin.com/qrW7ZpcG](https://pastebin.com/qrW7ZpcG)
典，爱来自佳诺


ZefewMD pb:
v1: [https://www.bilibili.com/video/BV17V41187kU/](https://www.bilibili.com/video/BV17V41187kU/)
v2: [https://www.bilibili.com/video/BV17N411o7cg/](https://www.bilibili.com/video/BV17N411o7cg/)
v3: [https://www.bilibili.com/video/BV195411A7b7/](https://www.bilibili.com/video/BV195411A7b7/)
v4: [https://www.bilibili.com/video/BV1Xb4y1Z72T/](https://www.bilibili.com/video/BV1Xb4y1Z72T/)
v5: [https://www.bilibili.com/video/BV1jf4y1b7dp/](https://www.bilibili.com/video/BV1jf4y1b7dp/)
v6: [https://www.bilibili.com/video/BV1aA411P7Gr/](https://www.bilibili.com/video/BV1aA411P7Gr/)
v7: [https://www.bilibili.com/video/BV1CS4y1f7Fe/](https://www.bilibili.com/video/BV1CS4y1f7Fe/)
“黄金时代的梦”


Elleptical FPS Pack Folder: [https://www.youtube.com/watch?v=rET6Fu2cDjw](https://www.youtube.com/watch?v=rET6Fu2cDjw)
ind: [https://www.mediafire.com/folder/wij0jonzv51x3/](https://www.mediafire.com/folder/wij0jonzv51x3/)
犹大赞助商


Ssel: [https://www.bilibili.com/video/av678139558](https://www.bilibili.com/video/av678139558)
ind: [https://l22333.lanzouw.com/b02oq4zda](https://l22333.lanzouw.com/b02oq4zda)
密码: l233
经典pack合集


<span style="background-color:rgb(255, 255, 255);font-size:11pt">Lastro</span>
-
<span style="background-color:rgb(255, 255, 255);font-size:11pt">2k: </span>[https://www.youtube.com/watch?v=hGtxLac2mzI](https://www.youtube.com/watch?v=hGtxLac2mzI)
ind: [https://pastebin.com/w1rMEAq6](https://pastebin.com/w1rMEAq6)
<span style="background-color:rgb(255, 255, 255);font-size:11pt">-</span>
<span style="background-color:rgb(255, 255, 255);font-size:11pt">2024: </span>[https://www.bilibili.com/video/av1355891991](https://www.bilibili.com/video/av1355891991)
ind: [https://pastebin.com/N9ehhEML](https://pastebin.com/N9ehhEML)
<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">-</span>
<span style="background-color:rgb(255, 255, 255)">Pack Bundle ft. Voice: </span>[https://www.bilibili.com/video/av113644012572315](https://www.bilibili.com/video/av113644012572315)
<span style="background-color:rgb(255, 255, 255)">ind: </span>[https://emt.lanzouq.com/b0mb4ppgj](https://emt.lanzouq.com/b0mb4ppgj)
<span style="background-color:rgb(255, 255, 255)">密码: d1ez</span>
-
个


Nakoso 2021: [https://www.bilibili.com/video/av113988616591286](https://www.bilibili.com/video/av113988616591286)
ind: [https://pastebin.com/Jzpyb8b5](https://pastebin.com/Jzpyb8b5)
aio: [https://www.mediafire.com/file/jx25splfc69ynxf/resourcepacks.zip/file](https://www.mediafire.com/file/jx25splfc69ynxf/resourcepacks.zip/file)
-
Nakoso 2022: [https://www.bilibili.com/video/av725750421](https://www.bilibili.com/video/av725750421)
aio: [https://www.mediafire.com/file/1y80tkhsq4tjcoe/resourcepacks.zip/file](https://www.mediafire.com/file/1y80tkhsq4tjcoe/resourcepacks.zip/file)
娥


woklywo: [https://www.youtube.com/watch?v=4AeOGGGu7OM](https://www.youtube.com/watch?v=4AeOGGGu7OM)
ind: [https://pastebin.com/bJJXQW1X](https://pastebin.com/bJJXQW1X)
aio: [https://www.mediafire.com/file/wu94k8lyl0691vp/resourcepacks.zip/file](https://www.mediafire.com/file/wu94k8lyl0691vp/resourcepacks.zip/file)
额


Kaoliar: [https://www.bilibili.com/video/av1000138494](https://www.bilibili.com/video/av1000138494)
ind: [https://jack-laogewen.lanzouv.com/b01a1boeh](https://jack-laogewen.lanzouv.com/b01a1boeh)
密码: 8wds
垃圾。


冰糖脆桃核武库(link见视频)
900: [https://www.bilibili.com/video/av1156485686](https://www.bilibili.com/video/av1156485686)
1100: [https://www.bilibili.com/video/av114204069664334](https://www.bilibili.com/video/av114204069664334)
300: [https://www.bilibili.com/video/av115192163735635](https://www.bilibili.com/video/av115192163735635)
1000: [https://www.bilibili.com/video/av115254541423165](https://www.bilibili.com/video/av115254541423165)
给材质神跪了



###### III. HCF

“Nightmare”

iil v1: [https://www.bilibili.com/video/av445206902](https://www.bilibili.com/video/av445206902)
ind: [https://wwni.lanzoum.com/b03kej6wf](https://wwni.lanzoum.com/b03kej6wf)h
密码: hutk
-
iil v2: [https://www.bilibili.com/video/av112964652763343](https://www.bilibili.com/video/av112964652763343)
ind: [https://wwxt.lanzout.com/b00tathp7e](https://wwxt.lanzout.com/b00tathp7e)
密码: www
-
iil v3: 看视频我只看棍母官方
-
iil v4: [https://www.bilibili.com/video/av113889899450919](https://www.bilibili.com/video/av113889899450919)
aio: 看视频我只看棍母官方
-
iil v5: [https://www.bilibili.com/video/av113172925190122](https://www.bilibili.com/video/av113172925190122)
ind: [https://wwxt.lanzout.com/b00tawzswd](https://wwxt.lanzout.com/b00tawzswd)
密码: www
-
万恶之源扫码了


oeu: [https://www.bilibili.com/video/av113977073861175](https://www.bilibili.com/video/av113977073861175)
ind pk: [https://www.mediafire.com/folder/v7bi0ncdotvaf/pack_folder](https://www.mediafire.com/folder/v7bi0ncdotvaf/pack_folder)
ind ol: [https://www.mediafire.com/folder/137t4et2hvulm/overlays](https://www.mediafire.com/folder/137t4et2hvulm/overlays)
滚去扫厕所



###### IV. og

“一将化身为众”

Elleptical: [https://www.bilibili.com/video/av926578255](https://www.bilibili.com/video/av926578255)
ind: [https://www.mediafire.com/folder/bv3qg9u8xjviv/Pack_Folder](https://www.mediafire.com/folder/bv3qg9u8xjviv/Pack_Folder)
没开pack display


bcz: [https://www.bilibili.com/video/av804424850](https://www.bilibili.com/video/av804424850)
aio: [http://www.mediafire.com/file/wchv9c1zio20zx1/Updated_Pack_Folder.rar/file](http://www.mediafire.com/file/wchv9c1zio20zx1/Updated_Pack_Folder.rar/file)
没开pack display



###### V. 荣誉提名

“The park of pack”

[Timon] Ayear
v1: ???
v2: [https://www.bilibili.com/video/av31845558](https://www.bilibili.com/video/av31845558)
v3: [https://www.bilibili.com/video/av45846298](https://www.bilibili.com/video/av45846298)
v4: [https://www.bilibili.com/video/av200009515](https://www.bilibili.com/video/av200009515)
顶尖重金属style

[Timon] SUPREME
v1: [https://www.bilibili.com/video/av22063574](https://www.bilibili.com/video/av22063574)
v2: [https://www.bilibili.com/video/av44455478](https://www.bilibili.com/video/av44455478)
前卫gui设计，印象深刻

[Timon] Vast 16x
[https://www.bilibili.com/video/av716845182](https://www.bilibili.com/video/av716845182)
超绝渐变，恢宏流光


[暮影Au7ismZ] Au7ismZ v2
[https://www.bilibili.com/video/av65372082](https://www.bilibili.com/video/av65372082)
来自19年的原创水晶剑，不应被忘记


[rAnbr0] "128x"es: [https://www.bilibili.com/video/av273237176](https://www.bilibili.com/video/av273237176)
优质二创


Deproved 1ks:
-
BlatantCheater: [https://www.bilibili.com/video/av113103148680144](https://www.bilibili.com/video/av113103148680144)
ind: [https://blatantcheater.lanzouu.com/b00jdnwy7a](https://blatantcheater.lanzouu.com/b00jdnwy7a)
密码: 3cbp
-
jxwxn8 all color ski: [https://www.bilibili.com/video/av115994366381098](https://www.bilibili.com/video/av115994366381098)
ind: [https://wwbbs.lanzouq.com/b00odnzmcb](https://wwbbs.lanzouq.com/b00odnzmcb) 密码: abu5
aio: [https://www.123865.com/s/A4Nojv-4dg5d](https://www.123865.com/s/A4Nojv-4dg5d)
or: [https://www.mediafire.com/file/k5m11g47tun5m5w/allcolorski.zip/file](https://www.mediafire.com/file/k5m11g47tun5m5w/allcolorski.zip/file)
-
致敬冲二打不过汗神冲一の疯狗Deproved



###### VI: DEAD

视频似了或者链接似了

<span style="background-color:rgb(255, 255, 255);font-size:11pt">YakumoRC - 八云红猫:  [VID DEAD]</span>
<span style="background-color:rgb(255, 255, 255);font-size:11pt">ind: </span>[https://pastebin.com/ZL4Vh3mc](https://pastebin.com/ZL4Vh3mc)

<span style="background-color:rgb(255, 255, 255);font-size:11pt">Stimpy Edits: [VID LOST]</span>
[https://www.mediafire.com/?sn3otzq9728ztoy&dkey=534x45mmskp](https://www.mediafire.com/?sn3otzq9728ztoy&dkey=534x45mmskp)

<span style="background-color:rgb(255, 255, 255);font-size:11pt">Mansdusty (Proxy): [NO VID]</span>
[https://mega.nz/file/RD0G1Y4A#I7V6N1FQ5vg1VNXFxsuSEdQOmaDpoIg3qjRf19ydgdY](https://mega.nz/file/RD0G1Y4A#I7V6N1FQ5vg1VNXFxsuSEdQOmaDpoIg3qjRf19ydgdY)

QwQTsuki: [https://www.bilibili.com/video/av983817082](https://www.bilibili.com/video/av983817082)
[LINK DEAD]



###### VII. More

<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">[Happychon] Eum3杂谈: </span>[https://www.bilibili.com/video/av114484450434305](https://www.bilibili.com/video/av114484450434305)
<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">爱来自3y_</span>

<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">[Nlich/上海沧桑] 原来有这么多经典POTPVP材质包你不知道？: </span>[https://www.bilibili.com/video/av451272715](https://www.bilibili.com/video/av451272715)
-
<span style="color:inherit;background-color:rgb(255, 255, 255);font-size:11pt">[Nlich/上海沧桑] 这么多材质包 你都用过吗？？？？？: </span>[https://www.bilibili.com/video/av1700124160](https://www.bilibili.com/video/av1700124160)
子增没活了





##### 1.2.3. CHAN

Timon Wong: [https://space.bilibili.com/15505075](https://space.bilibili.com/15505075/)
国内顶尖原创材质作者

Kazari: [https://space.bilibili.com/339244769](https://space.bilibili.com/339244769)
#CN Arissi

BlatantCheater (AngelBeat): [https://space.bilibili.com/630656685](https://space.bilibili.com/630656685/)
解决策の宝库

节哀 (900elo): [https://space.bilibili.com/412514398](https://space.bilibili.com/412514398)
搬搬搬



先行者们:

iSparkton: [https://www.youtube.com/@iSparkton](https://www.youtube.com/@iSparkton)
Tory: [https://www.youtube.com/@Torylmao](https://www.youtube.com/@Torylmao)
BabyMarcel: [https://www.youtube.com/@BabyMarcel](https://www.youtube.com/@BabyMarcel)
Latenci: [https://www.youtube.com/@Latenci](https://www.youtube.com/@Latenci)
Apexay: [https://www.youtube.com/@Apexay](https://www.youtube.com/@Apexay)
Dualzz: [https://www.youtube.com/@RedstoneDualzz](https://www.youtube.com/@RedstoneDualzz)
Tye3315: [https://www.youtube.com/@tye3315](https://www.youtube.com/@tye3315)
Arissi: [https://www.youtube.com/@Arissi](https://www.youtube.com/@Arissi)
Metar0X: [https://www.youtube.com/@Metar0X](https://www.youtube.com/@Metar0X)
Mellor: [https://www.youtube.com/@MellorPvP](https://www.youtube.com/@MellorPvP)
Zefew: [https://www.youtube.com/@RVLZefew](https://www.youtube.com/@RVLZefew)



##### 1.2.4. extra???

<span style="background-color:rgb(255, 255, 255);font-size:11pt">Bilibili Playlist: </span>[https://space.bilibili.com/1049515077/favlist?fid=1266851177​](https://space.bilibili.com/1049515077/favlist?fid=1266851177)
<span style="background-color:rgb(255, 255, 255);font-size:11pt">Youtube Playlist: </span>[https://www.youtube.com/playlist?list=PLuCj9dpMJyQuJDmrHHW02VdOzAo2FeGmI](https://www.youtube.com/playlist?list=PLuCj9dpMJyQuJDmrHHW02VdOzAo2FeGmI)
<span style="background-color:rgb(255, 255, 255);font-size:11pt">Ranked Bedwars (Proxy): </span>[https://docs.google.com/document/u/0/d/1xqLvAHx2E_ZsDCnpW6u8FNZu_uzIvVjAzjQwxmT6VYY/mobilebasic?pli=1](https://docs.google.com/document/u/0/d/1xqLvAHx2E_ZsDCnpW6u8FNZu_uzIvVjAzjQwxmT6VYY/mobilebasic?pli=1)







and

I1ZBTEUgUFJPSkVDVA==







Q: 几把的我要看的不是这个，投票的材质包发展史呢？快端上来啊
A:
![image](/images/img_1772374099510_y9e1.jpg)


---
### 1.3. Servers

“当今恐是前所未有的服务器荒漠期”


##### 1.3.1. INTL

Minemen
[as.minemen.club](https://minemen.club) (SG)
[eu.minemen.club](https://eu.minemen.club) (DE)
[na.minemen.club](https://na.minemen.club) (CA)
dc: [https://discord.gg/minemenclub](https://discord.gg/minemenclub)
日薄西山


Kohi.lol
[as.kohi.lol](https://as.kohi.lol) (SG)
[eu.kohi.lol](https://eu.kohi.lol) (EU)
[na.kohi.lol](https://na.kohi.lol) (US)
[au.kohi.lol](https://au.kohi.lol) (AU)
dc: [https://discord.gg/SpyQmssDUQ](https://discord.gg/SpyQmssDUQ)
复古服


Kaiya (1.7 → 1.21)
[eu.kaiya.rip](https://eu.kaiya.rip) (EU)
[na.kaiya.rip](https://na.kaiya.rip) (NA)
dc: [https://discord.gg/dBZZbrADEU](https://discord.gg/dBZZbrADEU)
修了



##### 1.3.2. CN

Wihar
[wihar.top](https://wihar.top) (浙江)
尿壶修成鱼形


Kazer
[kazer.cc](https://kazer.cc) (~~北京~~ → 上海)
“<span style="color:rgb(68, 68, 68);background-color:rgb(255, 255, 255)">你心中的CN Lunar，在那个盛夏就已经死了。你现在看到的，不过是它腐烂的过程</span>”


Jealousy
[jealousy.cc](https://jealousy.cc) (湖北)
rutar之遗志

Micet
[micet.cc](https://micet.cc) (上海)
reborn from 2018


Iceland
[potpvp.cc](https://potpvp.cc) (湖北)
瓶碎了，化为冰封之岛



##### 1.3.3. AS

Syuu
[syuu.net](https://syuu.net) (JP)
dc: [https://discord.gg/syuunet](https://discord.gg/syuunet)
约架圣地今已门可罗雀
*cn proxy已失效


ArkaMC
[arkamc.net](https://arkamc.net) (KR)
能打赢复活赛吗



##### 1.3.4. EU

PvPLounge
[beta.pvplounge.eu](https://beta.pvplounge.eu) (UK) [WL]
dc: [https://discord.com/invite/J4KFkuZkcw](https://discord.com/invite/J4KFkuZkcw)
高仿的lounge
*dc发id获取免费白名单


Renga
[renga.zip](https://renga.zip) (FI)
dc: [https://discord.gg/JHVpzUnb8n](https://discord.gg/JHVpzUnb8n)
毛子肘赢大芬兰了，酥桃认证服务器


PvPRivals
[pvprivals.net](https://pvprivals.net) (DE) {pre pvpgym}
dc: [https://discord.gg/pvprivals](https://discord.gg/pvprivals)
主做uhc mode



##### 1.3.5. NA

Nostalgia
[nostalgia.earth](https://nostalgia.earth) (CA) [WL] {pre HVBC}
dc: [https://discord.gg/jKpU7hfjXt](https://discord.gg/jKpU7hfjXt)
Melkiller从HVBC独走开的服，成本巨大。支持下布列塔尼二次元战神谢谢喵
*进dc说我拉的你，他包给wl的


~~Raze: 圈钱伪政府~~


Ghostly
[ghostly.live](https://ghostly.live) (US) [拉美生态]
dc: [https://www.discord.gg/ghostly](https://www.discord.gg/ghostly)
耐活王还在蒸，高延迟友好，玩法多样
*反作弊稀烂


Astral
[astralmc.cc](https://astralmc.cc) (US) [拉美生态]
dc: [https://discord.gg/astralmc](https://discord.gg/astralmc)
玩法多样，最后一个比较像Lunar的服务器
*反作弊稀烂，hcf & kitmap有点圈


Elevatemc
[elevatemc.com](https://elevatemc.com) (CA)
dc: [https://discord.gg/hctranked](https://discord.gg/hctranked)
主做hcf teamfight，对高延迟不友好


Velt
[veltpvp.com](https://veltpvp.com) (US) [DEAD]
dc: [https://discord.gg/h5ywm25gKu](https://discord.gg/h5ywm25gKu)
在打复活赛



---
### 1.4. Tools

“非我所有，为我所用”


##### 1.4.1. Social

这个我本该裁掉的奈何某些人太，，，

国内b站qq最多加个kook；国际yt dc最多加个x和tg

什么你上不了外网？那我问你你玩网几年了，小于2年你反思一下为什么会看到这个文档，大于2年？你更该反思了


Discord: [https://discordapp.com/channels/@me](https://discordapp.com/channels/@me)

Twitter: [https://x.com/home](https://x.com/home)

Telegram A: [https://web.telegram.org/a](https://web.telegram.org/a)

Telegram K: [https://web.telegram.org/k](https://web.telegram.org/k)



##### 1.4.2. Website

Namemc: [https://namemc.com/](https://namemc.com/)
id & 皮肤 & 服务器 查询


蓝奏云: [https://up.woozooo.com/mydisk.php](https://up.woozooo.com/mydisk.php)
国内盘，分享小型文件 (材质包再敢传百度夸克的试一个看看啊?)

Mediafire: [https://app.mediafire.com/folder/myfiles](https://app.mediafire.com/folder/myfiles)
国际盘，分享大型文件 (用临时邮箱注册可以无限薅)


Wormhole: [https://wormhole.app/](https://wormhole.app/)
端到端加密&限时限量大文件分享

workupload: [https://workupload.com/](https://workupload.com/)
欧公子版奶牛快传，dmca去死吧。支持阅后即焚

dlgg: [https://download.gg/](https://download.gg/)
端到端加密，25gb limit

TmpLink: [https://www.tmp.link/](https://www.tmp.link/?tmpui_page=/vx&module=filelist&view=list)
不限速不限文件大小，7d内无人下载文件自动删除


Pastebin: [https://pastebin.com/](https://pastebin.com/)
维护式长文本分享

pastefy: [https://pastefy.app/](https://pastefy.app/)
隐私保护但不可更改长文本分享

PWpush: [https://eu.pwpush.com/](https://eu.pwpush.com/)
限时限量&阅后即焚文本分享


图床: [https://img.remit.ee/](https://img.remit.ee/)
more: [https://sspai.com/post/98911](https://sspai.com/post/98911)


Wayback Machine: [https://archive.org/](https://archive.org/)
互联网档案馆


ReURL: [https://reurl.cc/main/cn](https://reurl.cc/main/cn)
纯净短链生成器

BypassVIP: [https://bypass.vip/](https://bypass.vip/)
绕过广告短链


VirusTotal: [https://www.virustotal.com/gui/home/upload](https://www.virustotal.com/gui/home/upload)
奶酪探索者


AICU: [https://www.aicu.cc/](https://www.aicu.cc/)
查评论

Comment Appeal: [https://www.bilibili.com/blackboard/cmmnty-appeal.html](https://www.bilibili.com/blackboard/cmmnty-appeal.html)
如题


FileCR: [https://filecr.com/us-en/](https://filecr.com/us-en/)
ez crk

rutor: [http://rutor.info/](http://rutor.info/)
丰矿的俄人网站

GnDown: [https://www.gndown.com/](https://www.gndown.com/)
423Down: [https://www.423down.com/](https://www.423down.com/)
YXSSP: [https://www.yxssp.com/](https://www.yxssp.com/)
GHXI: [https://www.ghxi.com/](https://www.ghxi.com/)
-
FirePX: [https://www.firepx.com/app/](https://www.firepx.com/app/)
MODSAPK: [https://getmodsapk.com/](https://getmodsapk.com/)
-
不解释




##### 1.4.3. Productivity
###### 
everything: [https://www.voidtools.com/zh-cn/](https://www.voidtools.com/zh-cn/)
本地搜索工具


idm crk: [https://www.mimods.com/99.html](https://www.mimods.com/99.html)
下载器插件&搬视频

Jdownloader: [https://jdownloader.org/](https://jdownloader.org/)
批量下载mediafire

qBittorrent: [https://www.qbittorrent.org/](https://www.qbittorrent.org/)
种子下载器


Bandizip 7.06: [https://www.lanzn.com/iUP8Hv0taej](https://www.lanzn.com/iUP8Hv0taej)
压缩文件查看器，选这个是因为可以快速preview 图片方便看材质包；7.06有暴力破解压缩包密码功能


Revo Uninstaller: [https://www.423down.com/8544.html](https://www.423down.com/8544.html)
清洁式软件卸载工具


NVCleanInstall: [https://www.techpowerup.com/download/techpowerup-nvcleanstall/](https://www.techpowerup.com/download/techpowerup-nvcleanstall/)
轮椅版N卡驱动安装器


paint.net: [https://www.dotpdn.com/downloads/pdn.html](https://www.dotpdn.com/downloads/pdn.html)
画材质包用的，半天找不到下载链接的出列


PhotoShop 2026: [https://filecr.com/windows/adobe-photoshop-download-0056/](https://filecr.com/windows/adobe-photoshop-download-0056/)
本该放在Video那边


Notepad3: [https://www.gndown.com/2011.html](https://www.gndown.com/2011.html)
最佳文本编辑器


Recuva: [https://filecr.com/windows/recuva/](https://filecr.com/windows/recuva/)
数据恢复，希望你用不上它




---
## Part 2. In-Game

### 2.1. Tutorial

##### Semi-Intro

To newgen: PvP是砍出来的，“教程”并不能代替实战，仅仅是告知你一些game sense，要想消化它们，没个三年两载的Practicing是不现实的，不要妄想一步登天。

自古以来所谓PvP教程乃是炒作重灾区，什么牛鬼蛇神都想来掺一脚博取小红点，社区流通的教学质量更是参差不齐。笔者经缜密考究后终得以下之清单，可供参考。



##### <span style="color:rgb(51, 51, 51);background-color:rgb(255, 255, 255)">2.1.1. Haiku</span>


<span style="color:rgb(51, 51, 51);background-color:rgb(255, 255, 255);font-size:11pt">[Qzark] Gui排布: </span>[https://www.bilibili.com/video/BV1JL4y177WZ/](https://www.bilibili.com/video/BV1JL4y177WZ/)
<span style="color:rgb(255, 0, 0);font-size:11pt">再拿牛鬼蛇神gui录视频的拖出去枪毙</span>


<span style="font-size:11pt">[</span><span style="color:rgb(96, 96, 96);background-color:rgb(255, 255, 255);font-size:11pt">iiLuna</span><span style="font-size:11pt">] Combo: </span>[https://www.bilibili.com/video/BV12m4y1i7MV](https://www.bilibili.com/video/BV12m4y1i7MV)
<span style="font-size:11pt">经典老番，初学者最佳入门视频</span>


<span style="font-size:11pt">[DiversityPvP] 重置疾跑: </span>[https://www.bilibili.com/video/BV1R34y1H7fM](https://www.bilibili.com/video/BV1R34y1H7fM)
<span style="font-size:11pt">对砍老兵Kaylr认证，侧重trade</span>


<span style="font-size:11pt">[Intel Edits] Combo: </span>[https://www.bilibili.com/video/BV1tT4y1P7mk](https://www.bilibili.com/video/BV1tT4y1P7mk)
<span style="font-size:11pt">Jump那段没啥用，重点在ad的节奏上</span>


<span style="font-size:11pt">[Zefew] tips: </span>[https://www.bilibili.com/video/BV12Z4y1M7rc](https://www.bilibili.com/video/BV12Z4y1M7rc)
必看，相当超前的tips


<span style="font-size:11pt">[Stimpy] 喷药: </span>[https://www.bilibili.com/video/av754452930](https://www.bilibili.com/video/av754452930)
<span style="font-size:11pt">要说的字幕里都说了，总结就是喷慢点喷稳点</span>


[Eloies]Run-eat 跑吃: [https://www.bilibili.com/video/BV12A411u7qX](https://www.bilibili.com/video/BV12A411u7qX)
全网最佳跑吃教学，吊打Ziblacking Nakoso。注意完美跑吃无法在现在的minemen生效
补充: 140+ms的情况下，喝完药/吃完食物 立刻切换到 食物/药水 可以强行卡完美跑吃/喝



##### <span style="color:rgb(51, 51, 51);background-color:rgb(255, 255, 255)">2.1.2. Sonnet</span>


<span style="font-size:11pt">[PuffedUp] 喷药:</span> [https://www.bilibili.com/video/av1300822255](https://www.bilibili.com/video/av1300822255)
<span style="font-size:11pt">更现代的喷药教学，侧重凹血省药</span>


<span style="font-size:11pt">Sag Blockhit</span>
-
<span style="font-size:11pt">尽可能地让格挡「填满」两次攻击之间的「间隔」时间，以让对手的hit打在自己的block上减少伤害</span>

<span style="font-size:11pt">[Lewelll] 效果展示: </span>[https://www.bilibili.com/video/BV1oy4y1n7NF](https://www.bilibili.com/video/BV1oy4y1n7NF)
<span style="font-size:11pt">also精品elo series，建议多看</span>

<span style="font-size:11pt">[LoveRenge/如果] Mid Sag (中文解说): </span>[https://www.bilibili.com/video/BV1mR4y1t77Q/](https://www.bilibili.com/video/BV1mR4y1t77Q/)
<span style="font-size:11pt">视频同款，减kb挡伤两不误</span>

<span style="font-size:11pt">[2665xg] Long Sag: </span>[https://www.bilibili.com/video/BV1q3411T7f4](https://www.bilibili.com/video/BV1q3411T7f4)
<span style="font-size:11pt">新手推荐，挡率更高但是kb sucks</span>

<span style="font-size:11pt">[Lewelll] Mid Sag: </span>[https://www.bilibili.com/video/BV1dr4y1K7WD/](https://www.bilibili.com/video/BV1dr4y1K7WD/)
<span style="font-size:11pt">Lewelll原教旨，改键了</span>

<span style="font-size:11pt">[Staind] “完美Sag节奏”: </span>[https://www.bilibili.com/video/av802438732/?t=15](https://www.bilibili.com/video/av802438732/?t=15)
<span style="font-size:11pt">“0 kb full ab”</span>



##### 2.1.3. Opus


[Raucous] Hit Select: [https://www.bilibili.com/video/av974289805](https://www.bilibili.com/video/av974289805)
目前没几个驾驭得了


<span style="font-size:11pt">[</span>VoidRegion<span style="font-size:11pt">] RBW Experience: </span>[https://www.bilibili.com/video/BV1jN411s78u](https://www.bilibili.com/video/BV1jN411s78u)
<span style="font-size:11pt">超现代sense，推荐加dc</span>


<span style="font-size:11pt">[唐妍熙] Knockback: </span>[https://www.bilibili.com/video/av114782548006153](https://www.bilibili.com/video/av114782548006153)
很长


[Revethere] Blog: [https://revethere.github.io/](https://revethere.github.io/)
我还没想好怎么介绍



##### 2.1.4. OSS


<span style="font-size:11pt">[Kirxo] BCZ jump: </span>[https://www.bilibili.com/video/BV1Wx41177GY](https://www.bilibili.com/video/BV1Wx41177GY/)
<span style="font-size:11pt">combo加伤的，只有大优势局有用，表演价值高一点</span>


[Nakoso] 蹭药: [https://www.bilibili.com/video/av336848237](https://www.bilibili.com/video/av336848237)
图一乐


<span style="font-size:11pt">[</span>minemanner<span style="font-size:11pt">] Jump Reset: </span>[https://www.bilibili.com/video/BV1sP4y1M7Lw](https://www.bilibili.com/video/BV1sP4y1M7Lw)
我不觉得jr有用


<span style="font-size:11pt">[DJThread] Debuff Tutorial: </span>[https://www.bilibili.com/video/BV17P411R7i8](https://www.bilibili.com/video/BV17P411R7i8)
也只有同好会看咯，RIP Debuff & Vanilla ~


<span style="font-size:11pt">[nffn] How 2 HCF: </span>[https://www.bilibili.com/video/BV1s642137xw](https://www.bilibili.com/video/BV1s642137xw)
<span style="font-size:11pt">another dead mode，给感兴趣的人</span>


<span style="font-size:11pt">(DEAD) [Intel Edits] pvp sense: </span>[https://www.bilibili.com/video/BV12e4y1p7Ty](https://www.bilibili.com/video/BV12e4y1p7Ty)



##### 2.1.5. Tweak


[Nilch 抗火药儿] In-Game Settings: [https://www.bilibili.com/video/av447677394](https://www.bilibili.com/video/av447677394)
本视频讲述了一位玩家的游戏优化经验，包括游戏设置和一些软件的使用。他强调不需要使用外部软件来优化游戏，只需要调整一些设置和清理内存即可。他还分享了一些其他的小技巧，如调整聊天栏大小和关闭一些动画等。--以上内容由AI视频小助理生成，关注解锁AI助理，由[@水肺药水](https://space.bilibili.com/280396990) 召唤发送


Nvidia控制面板: [https://www.bilibili.com/video/av113961890484183](https://www.bilibili.com/video/av113961890484183)
用A卡的埋了吧


--
!  以下内容观看前请确保自己有足够动手能力。优化有风险，重装需谨慎；BoosterX一时爽，无脑最大火葬场。


[YoxOnqQAQ] tweak p1: [https://www.bilibili.com/video/av115368492272304](https://www.bilibili.com/video/av115368492272304)
p2: [https://www.bilibili.com/video/av115481403001924](https://www.bilibili.com/video/av115481403001924)

CS2调机器(方块人思路同理): [https://www.bilibili.com/video/av113754054460421](https://www.bilibili.com/video/av113754054460421)

ZyperWinHub: [https://www.bilibili.com/video/av114843717733352](https://www.bilibili.com/video/av114843717733352)

Dism++: [https://www.bilibili.com/video/av113040737436391](https://www.bilibili.com/video/av113040737436391)


--
JVM Arguments: [https://exa.y2k.diy/garden/jvm-args/](https://exa.y2k.diy/garden/jvm-args/)
这好似是高版本的


Windows 10 LTSC: [https://www.bilibili.com/video/av578920941](https://www.bilibili.com/video/av578920941)
下载时请用镜像




### 2.2. Whenever Whatever Whoever

那些无论何时何地任何人都值得观看的

Lunar Champs:
[https://www.bilibili.com/video/BV19S4y1v7zP/](https://www.bilibili.com/video/BV19S4y1v7zP/)
[https://www.bilibili.com/video/BV1jU5EzYE5Q/](https://www.bilibili.com/video/BV1jU5EzYE5Q/)
[https://www.bilibili.com/video/BV1BmVvz5EA2/](https://www.bilibili.com/video/BV1BmVvz5EA2/)
[https://www.bilibili.com/video/BV1wS4y1q7jV/](https://www.bilibili.com/video/BV1wS4y1q7jV/)
[https://www.bilibili.com/video/BV1QS4y1t7YW/](https://www.bilibili.com/video/BV1QS4y1t7YW/)
[https://www.bilibili.com/video/BV1aw41117Mb/](https://www.bilibili.com/video/BV1aw41117Mb/)
[https://www.bilibili.com/video/BV1fd4y1S7aC/](https://www.bilibili.com/video/BV1fd4y1S7aC/)
[https://www.bilibili.com/video/BV1ve4y1t7aT/](https://www.bilibili.com/video/BV1ve4y1t7aT/)


时代地产搬的19h 100集 full matches: [https://www.bilibili.com/video/av691951025](https://www.bilibili.com/video/av691951025)


Lastro elo series p1:
[https://www.bilibili.com/video/BV1tA41137Jp/](https://www.bilibili.com/video/BV1tA41137Jp/)
[https://www.bilibili.com/video/BV1EQ4y1a7y7/](https://www.bilibili.com/video/BV1EQ4y1a7y7/)
[https://www.bilibili.com/video/BV1db4y117J2/](https://www.bilibili.com/video/BV1db4y117J2/)
[https://www.bilibili.com/video/BV1C64y1h7yb/](https://www.bilibili.com/video/BV1C64y1h7yb/)
[https://www.bilibili.com/video/BV1iL4y167po/](https://www.bilibili.com/video/BV1iL4y167po/)
[https://www.bilibili.com/video/BV1eM4y1P7Ny/](https://www.bilibili.com/video/BV1eM4y1P7Ny/)
[https://www.bilibili.com/video/BV1Fm4y1S7JC/](https://www.bilibili.com/video/BV1Fm4y1S7JC/)
[https://www.bilibili.com/video/BV1JT4y1X7yH/](https://www.bilibili.com/video/BV1JT4y1X7yH/)
[https://www.bilibili.com/video/BV1wP4y1w7Tk/](https://www.bilibili.com/video/BV1wP4y1w7Tk/)
[https://www.bilibili.com/video/BV1HR4y1L7qh/](https://www.bilibili.com/video/BV1HR4y1L7qh/)
[https://www.bilibili.com/video/BV1tU4y1o7YQ/](https://www.bilibili.com/video/BV1tU4y1o7YQ/)
[https://www.bilibili.com/video/BV11a411b7SW/](https://www.bilibili.com/video/BV11a411b7SW/)
[https://www.bilibili.com/video/BV1hq4y1e74M/](https://www.bilibili.com/video/BV1hq4y1e74M/)
[https://www.bilibili.com/video/BV1Wq4y1Y7jL/](https://www.bilibili.com/video/BV1Wq4y1Y7jL/)
[https://www.bilibili.com/video/BV1rT41137UD/](https://www.bilibili.com/video/BV1rT41137UD/)
-
Lastro elo series p2:
[https://www.bilibili.com/video/BV1bz4y1v7sr/](https://www.bilibili.com/video/BV1bz4y1v7sr/)
[https://www.bilibili.com/video/BV1Ym4y1g7o7/](https://www.bilibili.com/video/BV1Ym4y1g7o7/)
[https://www.bilibili.com/video/BV1dN4y1C73q/](https://www.bilibili.com/video/BV1dN4y1C73q/)
[https://www.bilibili.com/video/BV1284y1R75Q/](https://www.bilibili.com/video/BV1284y1R75Q/)
[https://www.bilibili.com/video/BV1Zw411N7Pi/](https://www.bilibili.com/video/BV1Zw411N7Pi/)
[https://www.bilibili.com/video/BV1Lj411W73G/](https://www.bilibili.com/video/BV1Lj411W73G/)
[https://www.bilibili.com/video/BV1eN4y1q7RU/](https://www.bilibili.com/video/BV1eN4y1q7RU/)
[https://www.bilibili.com/video/BV1nT4m1S7kF/](https://www.bilibili.com/video/BV1nT4m1S7kF/)
[https://www.bilibili.com/video/BV1LA4m1G7az/](https://www.bilibili.com/video/BV1LA4m1G7az/)
[https://www.bilibili.com/video/BV1vz421974j/](https://www.bilibili.com/video/BV1vz421974j/)
[https://www.bilibili.com/video/BV1Pt421g7Ui/](https://www.bilibili.com/video/BV1Pt421g7Ui/)


Idiol elo series: [https://www.bilibili.com/video/av685287849](https://www.bilibili.com/video/av685287849)


Tringed elo series: [https://www.bilibili.com/video/BV1JP4y1s7jc/](https://www.bilibili.com/video/BV1JP4y1s7jc/)
[https://www.bilibili.com/video/BV1DS4y1C7q2/](https://www.bilibili.com/video/BV1DS4y1C7q2/)


isla elo series 2023: [https://www.bilibili.com/video/BV13c411J76V/](https://www.bilibili.com/video/BV13c411J76V/)


Staind vs Nakoso: [https://www.bilibili.com/video/av778003465](https://www.bilibili.com/video/av778003465)


Eloies vs Kyeick: [https://www.bilibili.com/video/av629086454](https://www.bilibili.com/video/av629086454)


Lizishu Elo Series [1339elo]: [https://www.bilibili.com/video/av1152702334](https://www.bilibili.com/video/av1152702334)

Lizishu vs Eloies: [https://www.bilibili.com/video/av1050974501](https://www.bilibili.com/video/av1050974501)



DefeatBoy in NA:
-
vs Staind: [https://www.bilibili.com/video/BV1ST4y1d7D6/](https://www.bilibili.com/video/BV1ST4y1d7D6/)
vs Jewdah: [https://www.bilibili.com/video/BV1S34y1d7y2/](https://www.bilibili.com/video/BV1S34y1d7y2/)
vs Jerseys: [https://www.bilibili.com/video/BV1RR4y1t7d8/](https://www.bilibili.com/video/BV1RR4y1t7d8/)
vs How2: [https://www.bilibili.com/video/BV1UR4y1t7pj/](https://www.bilibili.com/video/BV1UR4y1t7pj/)
vs Miami/Coxcum: [https://www.bilibili.com/video/BV13N411e7KY/](https://www.bilibili.com/video/BV13N411e7KY/)
vs ZIBLACKINGGG: [https://www.bilibili.com/video/BV11t4y1e7q9/](https://www.bilibili.com/video/BV11t4y1e7q9/)
vs Scholar: [https://www.bilibili.com/video/BV1DA41187Qh/](https://www.bilibili.com/video/BV1DA41187Qh/)
vs HydriZe: [https://www.bilibili.com/video/BV1fE411H7nk/](https://www.bilibili.com/video/BV1fE411H7nk/)
-
elo series:
[https://www.bilibili.com/video/BV1Bg411j7Bs/](https://www.bilibili.com/video/BV1Bg411j7Bs/)
[https://www.bilibili.com/video/BV15541127ft/](https://www.bilibili.com/video/BV15541127ft/)
[https://www.bilibili.com/video/BV1SC4y1b72s/](https://www.bilibili.com/video/BV1SC4y1b72s/)
-
Lunar Tournament: [https://www.bilibili.com/video/BV1JL4y1e71p/](https://www.bilibili.com/video/BV1JL4y1e71p/)




### 2.3. Appreciation!

「Mythological Artascope of PotPvP Dynasty」

<span style="color:rgb(123, 127, 131);font-size:9pt">*这是个脑子一热开了坑最终弃掉的，灵感来源于</span>[这个](https://tieba.baidu.com/p/6593286560)<span style="color:rgb(123, 127, 131);font-size:9pt">和</span>[那个](https://tieba.baidu.com/p/5272254427)<span style="color:rgb(123, 127, 131);font-size:9pt">的申必扑克，完成度很低而且很尬(甚至link全几把失效了)，况且potpvp也搞不了这么雅的艺术。但这个标题很吊啊，留着纪念了</span>



##### 2.3.1. Classic

<span style="font-size:11pt">[Jewdah] 8 blocking on lunar client: </span>[https://www.bilibili.com/video/BV1Wm4y1R7kp](https://www.bilibili.com/video/BV1Wm4y1R7kp)
神

[Jewdah] smacking kids on the craft: [https://www.bilibili.com/video/BV1Eb4y1i7sc](https://www.bilibili.com/video/BV1Eb4y1i7sc)
坟

Jewdah的所有视频都应该看😡


[iPlayForChange/嫦娥] 砍你爷: [https://www.bilibili.com/video/av545841891](https://www.bilibili.com/video/av545841891)
听说720p能让渲染变好看



##### 2.3.2. Gang

[Kyeick] Best in the Game: [https://www.bilibili.com/video/av373343351](https://www.bilibili.com/video/av373343351)
5:52 part II看看看看看看看

[Kyeick] Just Better: [https://www.bilibili.com/video/av891333293](https://www.bilibili.com/video/av891333293)
ByRez qwq

[Kyeick] the best of all time 🌏💯: [https://www.bilibili.com/video/av338361406](https://www.bilibili.com/video/av338361406)
ByRez pwp

[Kyeick] NONE: [https://www.bilibili.com/video/av810889813](https://www.bilibili.com/video/av810889813)
[标题来源](https://www.emojiall.com/zh-hans/emoji/‍)

筱燃鸡的所有视频都应该看😡


[Staind] Best in the Game: [https://www.bilibili.com/video/av1556497493](https://www.bilibili.com/video/av1556497493)
掉药了谁的药啊


[ByRez] 2000 Elo on PvPGym with Antic Client: [https://www.bilibili.com/video/av376731552](https://www.bilibili.com/video/av376731552)
好喜欢这个端的gui谁懂

[ByRez] Italian Players #4: [https://www.bilibili.com/video/av843604879](https://www.bilibili.com/video/av843604879)
dislike = losers


[BCZ] I'm the best at this game: [https://www.bilibili.com/video/av18460181](https://www.bilibili.com/video/av18460181)
飞起来



##### 2.3.3. Chill

[yungsaphars] i use reach lol (best eu): [https://www.bilibili.com/video/av1550313132](https://www.bilibili.com/video/av1550313132)
爹


[Zefew] Im the best (Pack Bundle) [Frozen]: [https://www.bilibili.com/video/av23480664](https://www.bilibili.com/video/av23480664)
妈


[Raucous] noob game: [https://www.bilibili.com/video/av208514606](https://www.bilibili.com/video/av208514606)
大胖狼你别删视频啊😭😭😭


[BCZ] old but gold: [https://www.bilibili.com/video/av221123445](https://www.bilibili.com/video/av221123445)
BCZ抄袭酥桃吧·。。。。


[d0wza] young but gold: [https://www.bilibili.com/video/av999775339](https://www.bilibili.com/video/av999775339)
酥桃抄袭BCZ吧·。。。。


[Staind] 1700Elo in a Day: [https://www.bilibili.com/video/av373847777](https://www.bilibili.com/video/av373847777)
聊天框看见了我的仇人errxr


[ByRez] #1 NoDeBuff on Syuu.net with 200ms: [https://www.bilibili.com/video/av544243967](https://www.bilibili.com/video/av544243967)
我的世界白瑞子只会做Gang? 300ms chill combo同样很秀thanks



##### 2.3.4. Drill

[qVarious] Best of qVarious ~ Farewell 👋: [https://www.youtube.com/watch?v=kpBnzq_HldM](https://www.youtube.com/watch?v=kpBnzq_HldM)
谁懂b站视频又没了，暂停施工





---
## Part 3. Video

待填坑……



---
## Part 4. Outra

待填坑……



---