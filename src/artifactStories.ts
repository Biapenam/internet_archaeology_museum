export const artifactStories: Record<string, {
  zh: { title: string; detail: string }
  en: { title: string; detail: string }
  source: { title: string; url: string }
}> = {
  mosaic: {
    zh: { title: '文字旁边第一次自然地出现图片', detail: 'Mosaic 把图片直接排在网页文字旁，而不要求读者另开图像文件。可以想象：一次点击后，页面开始像杂志一样图文并置。' },
    en: { title: 'Pictures appeared alongside text', detail: 'Mosaic displayed pictures inside the page alongside text. Imagine a web page becoming an illustrated spread instead of a list of separate image files.' },
    source: { title: 'NCSA · Mosaic history', url: 'https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/' },
  },
  win95: {
    zh: { title: '从“开始”按钮进入电脑', detail: 'Windows 95 带来了“开始”按钮和任务栏。日常操作从这个入口寻找程序，再通过任务栏在打开的窗口之间切换。' },
    en: { title: 'Starting from the Start button', detail: 'Windows 95 introduced the Start button and taskbar. Programs gained a familiar entry point, with open windows visible along the taskbar.' },
    source: { title: 'Microsoft · Launch of Windows 95', url: 'https://news.microsoft.com/announcement/launch-of-windows-95/' },
  },
  iphone: {
    zh: { title: '用手指直接操作口袋里的网络', detail: '初代 iPhone 的多点触控界面让人通过点按、轻扫和捏合操作网页、邮件和地图。网络入口不再只在桌面前。' },
    en: { title: 'The internet under your fingers', detail: 'The first iPhone paired web browsing, email, and maps with taps, flicks, and pinches on a multi-touch screen.' },
    source: { title: 'Apple · iPhone premieres', url: 'https://www.apple.com/newsroom/2007/06/28iPhone-Premieres-This-Friday-Night-at-Apple-Retail-Stores/' },
  },
}
