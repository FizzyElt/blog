---
title: "Rust 非同步機制"
pubDate: 2022-08-20
description: "對於 Rust 非同步程式的初步解析"
tags: ["Rust", "asynchronous"]
---

此筆記是對 Rust async book [Under the hood: Executing Futures and Tasks](https://rust-lang.github.io/async-book/02_execution/01_chapter.html) 章節作解析。

閱讀本文必須先備知識

- `Arc` 的作用
- Rust channel 基本概念
- Rust thread 的基本使用
- Future trait 的基本概念

### 前言

`Future`，是 Rust 運作非同步程式的核心零件，但是單單只有 `Future` 整個非同步程式是無法運作的，必須要有個機制去運行跟調度，而這個機制就是 Rust 給予各個到套件跟函式庫去作自由發揮跟設計，每種用法跟效能上都有差異，但 async book 帶著我們做了一個最單純的版本，讓我們透過這個範例去了解實際上 `Future` 是怎麼被運用，以及 `waker` 扮演什麼樣的角色。

建議先照書上全部寫一遍，再來這裡看解說。

#### Executor

Executor 是負責對已經實作 Future `poll` method 的**區塊**或**函式**做 poll，並傳遞一個 `waker` 給該**區塊**或**函式**，做下次喚醒。
你會看到範例中會使用 channel 去接收傳來的 task，因為要持續的接收跟執行所以用 while。

```rust
struct Executor {
  ready_queue: Receiver<Arc<Task>>,
}

impl Executor {
  fn run(&self) {
    while let Ok(task) = self.ready_queue.recv() {
      let mut future_slot = task.future.lock().unwrap();
      
      if let Some(mut future) = future_slot.take() {
        let waker = waker_ref(&task);
        let context = &mut Context::from_waker(&*waker);
        
        if future.as_mut().poll(context).is_pending() {
            *future_slot = Some(future);
        }
      }
    }
  }
}
```

#### Spawner 

主要作為執行 async 區塊作第一次的 poll（讓 Executor 傳遞 `waker`），不然永遠無法有機會被喚醒。

```rust
#[derive(Clone)]
struct Spawner {
  task_sender: SyncSender<Arc<Task>>,
}

impl Spawner {
  fn spawn(&self, future: impl Future<Output = ()> + 'static + Send) {
    let future = future.boxed();
    let task = Arc::new(Task {
      future: Mutex::new(Some(future)),
      task_sender: self.task_sender.clone(),
    });

    self.task_sender.send(task).expect("too many tasks queued")
  }
}
```

#### Task

每次執行一個 async 區塊或函式就會產生一個對應的 task 做儲存，當 `async` 區塊或函式完成時會呼叫  `wake`，而對應的 task （實作 `ArcWake` trait）將重新把自己丟到 executor 作  `poll` ，完成一個非同步操作。

```rust
struct Task {
  future: Mutex<Option<BoxFuture<'static, ()>>>,
  task_sender: SyncSender<Arc<Task>>,
}

impl ArcWake for Task {
  fn wake_by_ref(arc_self: &Arc<Self>) {
    let cloned = arc_self.clone();
    arc_self
      .task_sender
      .send(cloned)
      .expect("too many task queued");
  }
}
```

因為這種機制，所以我們都說 Rust 的非同步是**被動式**的，由 `async` 區塊或函式本身主動通知 executor 重新 `poll` 來取得當前進展。

### 流程

所以一整個流程從開始到結束是這樣子的

1. spawner 將 `async` 轉成一個 **Task** 丟給 executor 作第一次的 `poll`。
2. 由於非同步還沒完成所以回傳 `Poll::Pending` ，並同時傳遞一個 `waker` 用於下次完成時喚醒。
3. 呼叫 `wake` 並且對應的 **Task** 執行 `wake_by_ref` ，重新將自己帶到 executor 作 `poll`。
4. 收到 `Poll::Ready(())` 這個非同步操作完整結束

### Waker

既然我們知道整個流程後，那其中最關鍵的當然是 `waker` ，所以我們可以單純把 `waker` 抽出來看他怎麼運作。

```rust
struct Task {
  name: String,
}

impl ArcWake for Task {
  fn wake_by_ref(arc_self: &Arc<Self>) {
    println!("{} wake up", arc_self.name);
  }
}

fn main() {
  let task = Arc::new(Task {
    name: "task".to_string(),
  });

  let waker = waker_ref::<Task>(&task);
  
  let cloned_waker = waker.clone();

  thread::spawn(move || {
    thread::sleep(Duration::from_secs(1));
    cloned_waker.wake();
    println!("done")
  })
  .join()
  .unwrap();
}
```

---
以上就是針對 Rust 非同步的簡易解析，如果想知道更詳細，我推薦去看 [Rust RFC 2592 futures](https://rust-lang.github.io/rfcs/2592-futures.html)，裡面完整的說明 Future 的設計思路，並且該 RFC 也在翻譯中，敬請期待。
