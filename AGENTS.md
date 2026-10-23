# 雨沐天堂專案規則

這個資料夾是「雨沐天堂」的獨立專案。使用者要求：後續所有雨沐天堂製作相關的程式、圖片、影片、設定、文件與中間產物，都放在這個資料夾內。

- 不要把雨沐天堂內容存入曜舞、曜川、胤天或凜夜的資料夾，也不要推送至其他網站的 Git repository。
- 可使用其他資料夾內的素材；採用時複製到本資料夾，避免跨專案相對路徑依賴。
- 圖片生成工具預設儲存位置的產物，交付前須複製到本專案內。
- 使用者已認可 `assets/brand/雨沐天堂-logo-v3-中英精品版.png`，它是目前正式 Logo；後續版本另存，不覆蓋原稿。
- 品牌方向：清新、高級、雨過天晴與重生寓意，保留經典天堂 Lineage 的中世紀奇幻氣質。主色為青玉、霧銀與少量香檳金。
- `assets/brand/`：主 Logo 與版本稿。
- `assets/line/`：LINE 頭貼等社群素材。
- `assets/backgrounds/`：無字背景。
- `assets/hero/`：官方網站主視覺。
- `design/`：設計提示詞與素材清單。
- 官網首頁：`index.html`；共用樣式與互動：`assets/css/site.css`、`assets/js/site.js`。
- 遊戲內容：`data/guides.js`，已獨立匯入 42 篇參考指南。所有數值暫屬設定草案。
- 使用者指定以 `https://lineage1reborn.com/` 為視覺與結構參考，介面使用繁體中文，追求簡易、明瞭與精細。
- 活動公告、下載連結、更新歷程先不放其他伺服器的內容；目前三個頁面保留空狀態。
- 不沿用其他伺服器的 LINE、客服、贊助入口或開服日期。
- `npm run dev` 啟動獨立本機預覽；`npm run check` 執行內容與互動檢查。
- 獨立 GitHub repository：`otian1434-star/yumu-lineage`。本資料夾已使用自己的 `.git`，禁止使用外層 repo 推送雨沐檔案。
- 正式網站為 project site：`https://otian1434-star.github.io/yumu-lineage/`，不可使用 GitHub 帳號根網址或其他官網路徑。
- GitHub Pages 來源：本 repo 的 `main` 分支 `/docs` 目錄。每次推送官網更新前，先執行 `npm run check` 與 `npm run build`，把更新後的 `docs/` 一併提交。
- `docs/` 是自動產生的部署副本，請修改 source 後重新建置，不要只修改 `docs/`。
- commit 使用本 repo local 身分：`otian1434-star <otian1434-star@users.noreply.github.com>`。
- 已確認開服時間：2026/11/12 20:00（Asia/Taipei）；`config.js` 的 `openingDate` 為倒數時間來源。
- 已確認版本設定：3.81 內掛版，經驗 15 倍（內掛 1 倍）、金幣 6 倍、掉落 5 倍、武防強化 2 倍、正義 3 倍、負重 4 倍、寵物經驗 3 倍；玩家上限 70 級、寵物 52 級、手點 25 點、萬能藥 10 瓶、素質總上限 35 點。
- 新手引導 Lv.45–55「魔族拋棄地」已移除開服暫未開放註記。維護時直接修改雨沐獨立資料，勿重新匯入曜舞資料覆蓋已確認內容。
- 全站頁尾私服123使用 `assets/reference/private-server-123.gif`；連結為 `https://www.gamex123.com/lineage.html`。
