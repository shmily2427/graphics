## 《情景折影》项目说明

本项目基于 Three.js 实现了一个致敬《纪念碑谷》的三维解谜小品《情景折影》，包含首页引导、主关卡与 Bonus 关卡两个可交互场景，并对原作者作品进行大幅精简，仅保留游戏相关体验。

---

### 1. 系统完整功能描述

- **首页 / 引导页（`index.html`）**
  - 展示“情景折影”标题和 Monument Valley 风格的山谷背景动画。
  - 中上方以打字机逐字效果显示三句游戏主旨文案，阐述公主、赎罪与人与人之间的情感纽带。
  - 提示文案“跟随光点前进”，并提供“开始游戏”按钮进入主关卡（`game.html`）。
  - 在非移动且非 Chrome 浏览器时给出中文提示引导使用 Chrome。

- **主关卡（第一关，`game.html` + `script/*.js`）**
  - 基于 `data.floorplan` 三维数组生成 Monument Valley 风格的立体关卡结构。
  - 玩家通过点击平台，引导主角自动寻路在看似不可能连接的路径上行走。
  - 关卡中的光点依次点亮，随着玩家前进逐渐解锁，形成视觉与交互上的引导。
  - 场景中心附近始终有主角站立，终点位置额外站着一个“母亲”角色，象征情感的归宿与陪伴。
  - 当主角走到终点坐标（BONUS 触发点）时，自动切换到第二关。

- **Bonus 关卡（第二关，`bonus.html` + 同一套脚本）**
  - 使用 `data.bonusStage` 三维数组定义新的几何布局。
  - 主角在新的关卡中继续按照点击路径自动寻路。
  - 终点位置同样站有“母亲”角色，但位置与第一关相对称，形成呼应。

- **核心交互与体验**
  - 三维场景通过 OrbitControls 支持自动旋转、缩放、平滑阻尼，让玩家能从固定视角欣赏关卡结构。
  - 点击平台会触发 BFS 寻路，主角沿着可行路径逐步移动；重力模拟保证角色始终“贴合”地面。
  - 所有非必要的简历/作品集/邮箱等页面已全部移除或物理删除，只保留游戏体验。

---

### 2. 模块流程、结构与关键实现说明

#### 2.1 文件结构（与游戏直接相关部分）

- `index.html`：首页引导、主旨文案、开始游戏按钮。
- `css/style.css`：首页视觉样式（山谷背景、标题、按钮、三句主旨文案的排版）。
- `game.html`：主关卡页面入口，引用 Three.js 以及所有游戏脚本。
- `bonus.html`：第二关页面入口，引用与主关相同的脚本，通过 `loadBonusListener` 进入 Bonus 模式。
- `script/game.js`：三维场景搭建、关卡网格渲染、Cube/Shape/Light 等基础几何体类。
- `script/eventListener.js`：窗口加载、动画主循环、重力与移动逻辑、寻路与事件系统。
- `script/object.js`：主角角色与“母亲”角色的模型加载与放置。
- `objects/cell/*.json`：关卡中尾巴、楼梯、柱子等几何模型数据。
- `objects/character/*`：主角/母亲共享的人物模型资源（OBJ + MTL）。

#### 2.2 关卡渲染流程（`script/game.js`）

- **关卡数据结构**
  - 使用 `data.floorplan[z][x][y]` 三维数组描述主关卡；
  - 使用 `data.bonusStage[z][x][y]` 描述 Bonus 关卡；
  - 数值含义：
    - `0`：空；
    - `1`：平台方块（可行走单元）；
    - `2`：终点“尾巴”造型；
    - `3`：楼梯；
    - `4`：光点；
    - `5`：柱子。

- **渲染过程**
  - 在 `initGame()` 中，根据 `floorplan` 计算整体尺寸并创建：
    - `scene`：Three.js 场景；
    - `renderer`：WebGL 渲染器；
    - `camera`：透视相机（固定俯视角）；
    - `light` / `ambient`：主光源与环境光；
    - `controls`：OrbitControls 实现自动旋转和阻尼缩放。
  - `floorplanRenderer()`：
    - 遍历 `floorplan` 的 `z/x/y` 三层索引，将每个单元映射到对应的世界坐标；
    - 按 cell 类型实例化 `Cube`、`Shape`、`Light` 等类；
    - 将生成的 Mesh/光源加入 `scene`；
    - 同时标记哪些单元是可行走平台，为后续寻路提供依据。

#### 2.3 角色与“母亲”模型（`script/object.js`）

- **主角（`loadCharacter(scene)`）**
  - 使用 `THREE.MTLLoader` 与 `THREE.OBJLoader` 加载 `character.mtl`/`character.obj`；
  - 在主关卡中，起始位置为 `floorplan` 中心（通过 `getActualPosition` 将网格坐标映射到世界坐标）；
  - 在 Bonus 关卡中，起始位置根据 `data.bonusStage` 的中心计算；
  - 统一设置缩放、旋转，并将对象保存到全局变量 `character`，供重力和寻路逻辑使用。

- **母亲角色（`loadMother(scene, mapLocation)`）**
  - 与主角复用同一人物模型资源；
  - 通过更大的缩放比例和不同的旋转姿态，形成“伫立守候”的造型；
  - 在 `object.traverse` 中：
    - 调整材质颜色为柔和粉色，以示区分；
    - 将各 Mesh 的 `raycast` 重写为空函数，屏蔽射线检测：
      - 避免母亲角色被点击命中，干扰玩家选中平台；
      - 避免重力射线与母亲发生碰撞，保证角色重力判定只依赖平台。
  - 在主关加载完成后，调用 `loadMother(scene, MOTHER_MAIN_END)` 将母亲放在第一关终点；
  - 在 Bonus 关加载完成后，调用 `loadMother(scene, MOTHER_BONUS_END)` 将母亲放在第二关终点。

#### 2.4 事件系统与寻路（`script/eventListener.js`）

- **全局常量与状态**
  - `INTRO`, `PORTFOLIO`, `CONTACT`, `BONUS`：四个关键坐标，依次对应不同光点与最终终点；
  - `MOTHER_MAIN_END`, `MOTHER_BONUS_END`：母亲角色在主关与 Bonus 关的终点坐标；
  - `DEST_BLACKLIST`：黑名单坐标列表，用于避免 BFS 把路径终点放在视觉上不可达的位置；
  - `character`：当前玩家角色 Mesh；
  - `progress`：存放尚未激活的光点，用于随玩家前进逐步点亮。

- **加载与动画主循环**
  - `loadListener()`（第一关）与 `loadBonusListener()`（第二关）均：
    - 监听 `window.load` 事件；
    - 设置 `settings`、背景色以及 `floorplan` / `bonusStage`；
    - 依次调用 `initGame()` → `loadCharacter(scene)` → 设置 `fpsInterval` 并启动 `animate()`；
    - 在完成后调用 `loadMother(...)` 生成母亲角色。
  - `animate()`：
    - 每帧内按设定帧率调用：
      - `applyGravity()`：通过 Raycaster 向下发射射线，让角色沿 Z 轴微调保证“贴”在平台上；
      - `applyMovement()`：根据路径栈移动角色、触发事件；
      - 更新 OrbitControls 与渲染器。

- **寻路与点击**
  - `mouseListener()` 在画布上监听 `mousemove` 与 `click/touchstart`：
    - 使用 Raycaster 从相机出发射线，检测点击命中的对象；
    - 只选择 type 为 `TYPE_PLATFORM` 的平台方块作为目标；
    - 调用 `findPath(target.position)` 计算路径，将结果放入全局 `path`。
  - `findPath()`：对 `data.floorplan` 做 BFS：
    - 节点为 `(z,x,y)`；边为四个方向 `(XM, XP, YM, YP)`；
    - 仅允许值为 `1`（平台）的节点入队；
    - 回溯 `parents` 映射，得到从 `start` 到 `dest` 的最短路径，并剔除黑名单终点。

- **终点判定与关卡切换**
  - 在 `applyMovement()` 中，通过 `getMapLocation(character.position)` 把角色世界坐标映射回网格坐标；
  - 当检测到当前位置等于 `BONUS` 坐标时：
    - 若 `eventRunning` 为 `false`，将其设为 `true` 并执行 `window.location.href = "bonus.html"`；
    - 从而实现第一关走到终点自动切换到 Bonus 关；
  - 其他光点位置则仅通过 `progress.shift()` 依次点亮，增强引导感。

#### 2.5 接口设计与主要函数实现

- **页面级接口（HTML → JS）**
  - `game.html`
    - 在 `<body>` 尾部调用 `loadListener();`：作为第一关的统一入口，负责绑定 `window.load` 并初始化 Three.js 场景与角色。
  - `bonus.html`
    - 在 `<body>` 尾部调用 `loadBonusListener();`：作为第二关入口，逻辑与第一关类似，但使用 `data.bonusStage` 和 `isBonus = true`。
  - `index.html`
    - 通过 `<a href="game.html" id="startButton">` 进入第一关；
    - 内联脚本暴露打字机函数，仅在首页作用域内运行，不影响游戏脚本。

- **核心 JS 接口与函数（按模块）**
  - `script/game.js`
    - `initGame(): Promise<void>`：初始化 Three.js 场景、相机、灯光、OrbitControls，并调用 `floorplanRenderer()` 渲染当前关卡网格。
    - `floorplanRenderer(): void`：遍历 `floorplan` 三维数组，创建 `Cube` / `Shape` / `Light` 实例并加入 `scene`。
    - `class Cube` / `class Shape` / `class Light`：封装不同几何体/光源的构造与 `render()` 方法，是整个世界构建的基础接口。
  - `script/object.js`
    - `loadCharacter(scene: THREE.Scene): Promise<void>`：加载主角模型，放置到主关或 Bonus 关的起点，并赋值给全局 `character`。
    - `loadMother(scene: THREE.Scene, mapLocation: {z,x,y}): Promise<void>`：在给定网格坐标生成“母亲”角色，设置粉色材质并禁用 Raycast。
  - `script/eventListener.js`
    - `loadListener(): Promise<void>`：第一关入口，对外暴露给 `game.html` 使用；内部负责绑定 `window.load`、初始化环境并启动动画循环。
    - `loadBonusListener(): Promise<void>`：第二关入口，对外暴露给 `bonus.html` 使用。
    - `applyGravity(): void`：用自下而上的 Raycaster 调整 `character` 的 Z 坐标，使其始终贴在当前平台上。
    - `applyMovement(): Promise<void>`：驱动角色根据 `path` 一步步移动，同时检测是否到达光点或终点并触发事件（包括关卡切换）。
    - `findPath(destination: THREE.Vector3): Promise<Array<{z,x,y}>>`：BFS 寻路接口，将点击到的平台世界坐标转换为网格路径。
    - `getMapLocation(vectorLocation: THREE.Vector3): {z,x,y}`：世界坐标 → 网格坐标映射函数。
    - `getActualPosition(mapVector: {z,x,y}): THREE.Vector3`：网格坐标 → 世界坐标映射函数。
    - `mouseListener(): void`：绑定鼠标/触摸事件，是玩家点击交互的统一入口。

#### 2.6 主要模块功能设计总结

- **`index.html` + `css/style.css`**
  - **功能**：承担叙事与引导，不参与具体游戏逻辑；负责品牌呈现、主旨文案展示（逐字打字）和开始按钮。
  - **接口**：仅通过普通 `<a href="game.html">` 将控制权交给 `game.html`，不与核心 JS 直接耦合。

- **`game.html` / `bonus.html`**
  - **功能**：Two-level 场景的宿主页面，负责加载 Three.js 及 `script/*.js`。
  - **接口**：分别调用 `loadListener()` 与 `loadBonusListener()` 作为入口函数，将初始化细节完全交给 JS 模块。

- **`script/game.js`**
  - **功能**：定义 3D 世界的“静态结构”，包括关卡网格、几何体类、相机/灯光/控制器配置。
  - **接口**：对外提供 `initGame()` 与若干类（`Cube/Shape/Light`），供事件模块调用。

- **`script/object.js`**
  - **功能**：封装人物模型的加载与放置，抽象出“主角”与“母亲”的生成逻辑。
  - **接口**：`loadCharacter()` / `loadMother()` 被事件模块调用，不直接参与输入处理。

- **`script/eventListener.js`**
  - **功能**：整个游戏的“运行时内核”，负责帧循环、输入事件、寻路和关卡切换。
  - **接口设计特点**：
    - 仅向 HTML 页面暴露两个入口函数 `loadListener` / `loadBonusListener`；
    - 内部通过一系列小函数（`applyGravity` / `applyMovement` / `findPath` 等）分层组织逻辑，便于阅读与扩展。

---

### 3. 实现工具、开发环境与主要库

- **开发环境**
  - 操作系统：macOS / Windows / Linux 通用（本项目为静态前端，不依赖后端环境）；
  - 运行方式：使用任意静态服务器（或直接双击 `index.html`，推荐使用 Chrome 打开以支持 WebGL 和最佳性能）。

- **主要实现工具与语言**
  - HTML5 + CSS3：构建页面结构与样式（`index.html`, `game.html`, `bonus.html`, `css/style.css` 等）；
  - JavaScript (ES5/ES6 混用)：实现场景逻辑、交互与动画；
  - Three.js：负责 WebGL 3D 渲染、OBJ/MTL 模型加载与光照控制；
  - 浏览器开发者工具：调试 WebGL 性能与事件逻辑。

- **主要第三方库**
  - `three.js`（`script/lib/three.js`）：
    - 渲染 3D 场景和几何体；
    - 使用 `THREE.OBJLoader` 与 `THREE.MTLLoader` 加载外部模型资源；
    - 使用 `THREE.OrbitControls` 提供旋转/缩放/阻尼等相机控制。
  - jQuery：
    - 由模版引入，用于部分旧版滚动/事件辅助（主游戏逻辑对 jQuery 依赖较少）。
  - 其余前端工具：
    - 用于首页背景视差滚动与兼容性处理（如 `skrollr.min.js`、`modernizr.js` 等），主要用于视觉效果增强。

---

如需查看更详细的核心实现（包括关键函数和注释），可参考仓库根目录下的 `core_code.txt` 文件，其中节选了 `script/game.js`、`script/object.js` 与 `script/eventListener.js` 的主要逻辑，并配有逐行中文注释。
