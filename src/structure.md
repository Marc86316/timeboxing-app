```
timeboxing-app/
├── index.html                  # 應用程式進入點 (Entry Point)
├── src/                        # 原始碼主目錄
│   ├── App.jsx                 # 頂層組件：負責「狀態提升」，管理全局數據流
│   ├── main.jsx                # 渲染 React 根節點
│   ├── components/             # UI 視圖層：獨立的功能組件
│   │   ├── Canvas.jsx          # 計畫畫布：視覺化時間軸與動態網格 (5-30min)
│   │   ├── BrainDump.jsx       # AI 大腦卸載：處理文字輸入與 AI 辨識介面
│   │   ├── Pomodoro.jsx        # 進階番茄鐘：包含滾輪尺規調節功能
│   │   └── MissionReport.jsx   # 任務回報：顯示作戰紀錄與分心數據對比
│   ├── hooks/                  # 邏輯隔離層：自定義 Hooks
│   │   ├── useScreenTime.js    # 量化數據邏輯：處理 getEvents() 與數據映射
│   │   └── useTaskState.js     # 任務管理邏輯：處理任務的 CRUD 與排序
│   ├── utils/                  # 輔助工具函式
│   │   ├── aiParser.js         # 負責解析 AI Brain Dump 的原始文字
│   │   └── timeHelpers.js      # 處理時間軸網格計算與熱點圖顏色權重
│   └── assets/                 # 靜態資源（音效、圖片、環境音場）
├── tailwind.config.js          # Tailwind CSS 設定檔：負責沈浸式介面與深色模式樣式
├── vite.config.js              # Vite 建置工具設定檔
├── package.json                # 專案依賴管理（React, Lucide React, Hooks 等）
└── README.md                   # 專案說明文件與開發路線圖
```
