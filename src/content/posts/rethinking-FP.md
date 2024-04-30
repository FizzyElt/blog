---
title: "重新思考 FP"
pubDate: 2022-06-07
description: "關於學習FP的一些過程及想法"
tags: ["Functional Programming"]
---

這篇文章是我學習 Functional Programming 的一個紀錄，同時講述哪些對於我來說是最有幫助的，以及該怎麼看待 Functor 跟 Monad，或許可以帶給讀者們一些啟發。

### 初步探索 FP

大概在去年，因緣際會下我接觸了 Functional Programming，當初想學習的原因是我想把前端專案中組件內雜亂的 function 跟 state 寫的更漂亮更整潔。在初期我應用了 pure function、immutable 想法寫程式有了不錯成效之後，我也進一步使用 lodash 內的 fp 做一些 function 的組合應用。


### Pure function

這大概是 FP 中最核心的一部分，也是最值得花時間的部分，不僅對為你學習 FP 打下紮實的基礎也對任何程式都是有幫助的，每個 function 都有明確的輸入輸出並且不影響任何外部的變數，這使我們不必過度的去堤防其他人在 function 內部做了各種額外得動作，導致發生非預期結果。

### Immutable

immutable 在一個較為複雜的 function 內起到了一個降低開發者心智負擔的效果，值一旦建立即不可變，我們不必在一個 function 中來回觀察變數的變化。而在一般的 pure function 可以避免因為語言特性而修改到外部變數，對其他人來說都是有益的，雖然有時會損失一些效能，但在不嚴重影響使用者體驗的情況下我認為是可以接受的。

### Function composition

這將會是 FP 最有趣的階段，在你使用 pure function 及 immutable 概念一段時間後，會期望這些東西能在更進一步的應用。而這個應用就是 function 的「組合」，當你開始嘗試組合時會遇到許許多多的狀況，像是 function 寫得不夠好導致難以與其他 function 組合，以及該怎麼分解一個複雜的流程。這是一個漫長的過程，但你會慢慢領略 FP 真正想傳達給你的訊息，前面這些準備就是為了讓你在這步運用的靈活自如。

### 瓶頸

而當我想學習 Functor、Monad 這些進階的概念時，我卻斷斷續續的卡了半年左右沒什麼進展，這中間我嘗試了很多，包含學習 Haskell、Category theory、觀看各種 Functor 跟 Monad 在 JS 的實作，但總覺得少了些什麼，似乎是我的理解方式錯了。

### 重新思考 Functor、Monad

最近我開始重新審視這些我學到的名詞，也重看了幾部影片跟幾篇文章，我好像解開了那心中的結，而這個關鍵是跟數學跟程式各個名詞的混淆有關。

為何我會說跟名詞個混淆有關呢？那是因為我同時去讀了數學的概念並且去觀看了程式的實作，並且網路上有大量的文章跟影片把數學跟程式放在一起說明，讓你搞不清楚現在學的是數學還是程式，當然這並不是那些資源的錯，畢竟現代網路上本來就充滿了大量資源，自己本身就要訓練辦別對自己有利的資訊的能力。

你會常常看到 **Functor**、**Monad、Maybe**、**Either**、**Maybe Functor**、**Either Monad** 各種名詞換來換去，而這些就是造成了我混淆的原因。那我們該怎麼看待這個問題？是先學數學再寫程式嗎？還是先寫程式在學數學？其實都不是重點，我認為最重要的是區分數學跟程式的目的及關係。

### 解開那心中的結

我們可以先想想 FP 是怎麼來的？為了讓程式更整潔更易讀，模仿數學的概念來思考程式的一種方法。基於這個想法我們再來看 **Functor**、**Monad**，這時候就要注意了，**Functor** 跟 **Monad** 是數學的名詞，跟程式本身並沒有太大關係，但我們為了利用 **Functor** 跟 **Monad** 的特性在程式裡創造出了各種 Type，像是 **Option**、**Maybe**、**Either** 等等，而這些 Type 都達成了 **Functor** 或 **Monad** 的定義/條件，進而達成了我們要的效果。

當你清楚了解之間的關係之後，你之後看到任何文章或影片你都能清楚的區分，知道是在教數學時就去看數學定義跟理論，如果是在教程式時就去了解程式跟哪個數學定理對應上了，並且明白了你現在使用的語言能詮釋 FP 的極限在哪，你不再糾結 Functor 應該是什麼，Monad 應該是什麼，而是你想利用這些特性達成什麼效果，當你到了這一步，你的思考就達到了另一個層次，而不被某些東西困住了。

### 結語

雖然 FP 在某種程度上還算小眾，不過學習過程中讓我嘗試了更多我之前完全不會碰的領域，我學會看懂一些數學符號，學習了一點 Haskell 輔助我了解 FP 的思維，問題的分解跟重組的核心想法使我面對複雜問題都能冷靜思考。將最小部分功能處理好與另一個功能組合，並持續的堆疊，最後將會變成一個連你也無法想像的應用及壯舉。

#### 參考連結

這幾部影片或文章都是點醒我的一個關鍵，希望能幫助正在學習 FP 的朋友一些啟發，剛接觸的人看不懂很正常，當你在學習的路途中卡住再回來看一遍重新思考一遍，肯定有所收穫。

- [Brian Beckman: Don't fear the Monad](https://www.youtube.com/watch?v=ZhuHCtR3xq8)
- [The Functional Programmer's Toolkit - Scott Wlaschin](https://www.youtube.com/watch?v=Nrp_LZ-XGsY)
- [Functors, Applicatives, And Monads In Pictures](https://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html)