import { nextTick } from '#imports'

import tailwindStandConfig from '~~/tailwind.config.mjs'

const pcBreakpoint = parseInt(tailwindStandConfig.theme.screens.pc.min.replace('px', ''), 10)

type UseMatchMediaListener = {
  setMatchMediaHandler: (handler: (mql: MediaQueryList | MediaQueryListEvent) => void) => void
}

export const useMatchMediaListener = (
  breakpoint = pcBreakpoint,
): UseMatchMediaListener => {
  const mediaQueryList = window.matchMedia(`screen and (min-width: ${breakpoint}px)`)

  const setMatchMediaHandler = (
    handler: (mql: MediaQueryList | MediaQueryListEvent) => void,
  ): void => {
    handler(mediaQueryList)

    nextTick(() => {
      // MEMO: 古い safari が addEventListener に非対応のため分岐する（ addListener は deprecated なので不要になったら消したい）
      // ref: https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event#browser_compatibility
      mediaQueryList.addEventListener('change', handler)
    })
  }

  return {
    setMatchMediaHandler,
  }
}
