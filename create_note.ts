import { readdir } from "node:fs/promises";
import { format } from "date-fns";

const createNote = async () => {
  const files = await readdir("notes");

  const lastIndex = files
    .map((s) => Number.parseInt(s.replaceAll(/n-|\.md/g, "")))
    .reduce((acc, n) => (n > acc ? n : acc), 0);

  const date = new Date();
  const dateString = format(date, "yyyy-MM-dd");

  const template = `---
id: ${lastIndex + 1}
title: ""
pubDate: ${dateString}
tags: []
draft: true
---
  `;

  await Bun.write(`notes/n-${lastIndex + 1}.md`, template);
};

createNote();
