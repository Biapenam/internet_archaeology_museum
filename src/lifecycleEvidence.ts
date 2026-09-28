import type { Source } from './types'

export const lifecycleEvidence: Record<string, { zh: string; en: string; source: Source; verifiedOn: string }> = {
  ie: {
    zh: '2022 年 6 月 15 日：Internet Explorer 11 桌面应用在部分 Windows 10 版本上结束支持；不是所有 IE 相关技术同时停止运行。',
    en: '15 June 2022: the Internet Explorer 11 desktop application ended support on certain Windows 10 versions; this did not end every IE-related technology.',
    source: { title: 'Microsoft Lifecycle · IE11 end of support', url: 'https://learn.microsoft.com/en-us/lifecycle/announcements/internet-explorer-11-end-of-support' },
    verifiedOn: '2026-09-28',
  },
  ipod: {
    zh: '2022 年 5 月：Apple 宣布最后一款 iPod touch 仅售至库存用完；这是产品销售的结束公告，并非所有设备停止使用。',
    en: 'May 2022: Apple said the final iPod touch would remain available while supplies lasted; this concerns sales, not the operation of existing devices.',
    source: { title: 'Apple Newsroom · The music lives on', url: 'https://www.apple.com/newsroom/2022/05/the-music-lives-on/' },
    verifiedOn: '2026-09-28',
  },
}
