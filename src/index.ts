import { match, MatchResult, MatchResultParams } from './match';
export { match, MatchResult, MatchResultParams };

class dom {
  /** Serverside safe document.location */
  dloc = typeof document !== 'undefined' ? document.location : { hash: '' };

  html5Base: null | string = null;
  html5ModeEnabled() {
    return this.html5Base !== null;
  }

  readLocation(): string {
    if (this.html5Base == null) {
      const hash =
        // When url shows '#'
        // - Non-IE browsers return ''
        // - IE returns '#'
        (this.dloc.hash === '' || this.dloc.hash === '#')
          ? '/'
          /** 
           * Remove the leading # 
           * This keeps the matching algorithm independent of `#` (client side routing) and `/` (server side routing)
           **/
          : this.dloc.hash.substring(1);

      return hash;
    }
    else {
      return window.location.pathname.substr(this.html5Base.length);
    }
  }

  /**
   * Used to track the last value set.
   * if it does not change we ignore events
   */
  oldLocation = this.readLocation();

  setLocation(location: string, replace: boolean) {
    if (this.readLocation() === location) return;

    if (typeof history !== 'undefined' && history.pushState) {
      if (replace) {
        history.replaceState({}, document.title, location)
      }
      else {
        history.pushState({}, document.title, location)
      }
      /**
       * Just calling history.pushState() or history.replaceState() won't trigger a popstate event
       */
      this.fire();
    } else {
      this.dloc.hash = location;
    }

    this.oldLocation = this.readLocation();
  }

  listeners: Listener[] = [];
  private fire = () => {
    const newLocation = this.readLocation();
    if (this.oldLocation === newLocation) return;
    this.listeners.forEach(l => l({ oldLocation: this.oldLocation, newLocation }));
    this.oldLocation = newLocation;
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', this.fire, false);
      window.addEventListener('popstate', this.fire);
    }
  }

  listen(cb: (evt: ChangeEvent) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    }
  }
}

/** Current listeners */
type ChangeEvent = { oldLocation: string, newLocation: string };
type Listener = { (evt: ChangeEvent): void };

export interface RouteChangeEvent {
  oldPath: string,
  newPath: string,
}
export interface RouteEnterEvent extends RouteChangeEvent {
  params: MatchResultParams
}

/** 
 * We support sync and async operations in the same API
 */
export type SyncOrAsyncResult<T> = T | Promise<T>;

export type RouteBeforeEnterResult = SyncOrAsyncResult<
  void | null | undefined
  | { redirect: string, replace?: boolean }>;

export type RouteEnterResult = void;

export type RouteBeforeLeaveResult = SyncOrAsyncResult<
  void | null | undefined
  /** false means you want to prevent leave   */
  | boolean
  | { redirect: string, replace?: boolean }>;

export interface RouteConfig {
  /**
   * The pattern to match against
   */
  $: string;

  /**
   * Called before entering a route. This is your chance to redirect if you want.
   **/
  beforeEnter?: (evt: RouteEnterEvent) => RouteBeforeEnterResult;

  /**
   * Called on entering a route.
   **/
  enter?: (evt: RouteEnterEvent) => RouteEnterResult;

  /**
   * On route leave,
   * you can redirect to elsewhere if you want or just return false to prevent leaving
   **/
  beforeLeave?: (evt: RouteChangeEvent) => RouteBeforeLeaveResult;
}


export class Router {
  dom = new dom();
  constructor(public routes: RouteConfig[]) {
    this.dom.listen(this.trigger);
  }

  /**
   * Runs through the config and triggers an routes that matches the current path
   */
  init() {
    return this.trigger({ oldLocation: '', newLocation: this.dom.readLocation() });
  }

  /**
   * Enables pure html5 routing.
   * NOTE: 
   * - Server must support returning the same page on route triggers.
   * - Your browser targets support pushState: https://caniuse.com/#search=pushstate
   */
  enableHtml5Routing(baseUrl: string = '') {
    this.dom.html5Base = baseUrl;
    this.dom.oldLocation = this.dom.readLocation();
    return this;
  }

  private trigger = async ({ oldLocation, newLocation }: ChangeEvent) => {
    const oldPath = oldLocation;
    const newPath = newLocation;

    /** leaving */
    for (const config of this.routes) {
      const pattern = config.$;

      if (match({ pattern, path: oldPath })) {

        if (config.beforeLeave) {
          const result = await config.beforeLeave({ oldPath, newPath });
          if (result == null) {
            /** nothing to do */
          }
          else if (typeof result === 'boolean') {
            if (result === false) {
              navigate(this.dom, oldLocation, true);
              return;
            }
          }
          else if (result.redirect) {
            navigate(this.dom, result.redirect, result.replace);
            return;
          }
        }
      }
    }

    /** entering */
    for (const config of this.routes) {
      const pattern = config.$;

      const enterMatch = match({ pattern, path: newPath });
      if (enterMatch) {
        if (enterMatch.remainingPath) {
          continue;
        }

        const params = enterMatch.params;

        /** beforeEnter */
        if (config.beforeEnter) {
          const result = await config.beforeEnter({ oldPath, newPath, params });
          if (result == null) {
            /** nothing to do */
          }
          else if (result.redirect) {
            navigate(this.dom, result.redirect, result.replace);
            return;
          }
        }

        /** enter */
        if (config.enter) {
          const result = await config.enter({ oldPath, newPath, params });
          return;
        }
      }
    }
  }
}

/**
 * Navigates to the given path
 */
export function navigate(dom: dom, path: string, replace?: boolean) {
  dom.html5ModeEnabled()
    ? dom.setLocation(`${dom.html5Base}${path}`, !!replace)
    : dom.setLocation(`#${path}`, !!replace);
}

/**
 * Gives you a link that when triggered, navigates to the given path
 */
export function link(dom: dom, path: string) {
  return dom.html5ModeEnabled()
    ? `${dom.html5Base!}${path}`
    /** 
     * Needs `./` to prevent accessibility error `link refers to non existing element`
     * 
     * e.g. 
     * path `/foo` => `./#/foo`
     **/
    : `./#${path}`;
}

/** 
 * Returns true if a modifier key is down.
 */
const isModifiedEvent = (event: MouseEvent): boolean => Boolean(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

/** 
 * Suppresses browser default `click` behaviour on link
 */
export const html5LinkOnClick = (dom: dom, {
  event,
  replace = false
}: {
  event: MouseEvent,
  replace?: boolean
}) => {
  const linkElement = event.target as HTMLLinkElement;
  if (
    !event.defaultPrevented && // onClick prevented default
    event.button === 0 && // ignore everything but left clicks
    !(linkElement).target && // let browser handle "target=_blank" etc.
    !isModifiedEvent(event) // ignore clicks with modifier keys
  ) {
    event.preventDefault();

    const location = linkElement.href;
    dom.setLocation(location, !!replace);
  }
}
