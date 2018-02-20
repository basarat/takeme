> Client side routing so simple that you will fall in love ❤️

<iframe src="https://ghbtns.com/github-btn.html?user=basarat&repo=takeme&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>

> [Powered by your github ⭐s](https://github.com/basarat/takeme/stargazers).

Uni directional data flow is the best data flow: 

![URL -> Application State -> Your View](https://raw.githubusercontent.com/basarat/takeme/master/docs/uni-directional.png)

Saw the other solutions out there, I had two difference of opinions:

* This is built in TypeScript, for TypeScript. Other libraries [will get there eventually](https://basarat.gitbooks.io/typescript/content/docs/why-typescript.html). Till then fighting with out-of-date type definitions was not fun.
* They encourage tangling routing with components. This can be a good idea, but any time I needed more power, I had to do things like wrap my component (which may or may not work with TS classes), imagine props getting passed magically (not very type safe) and jump other hoops like `next` and `done` callbacks (we just use promises).

If existing solutions work well for you (`npm install foo foo-bar @types/foo @types/foo-bar`) *thats okay*. You can move on and live a happy life yet 🌹

> PROTIP: prefer refactorability over magic.

## Demo

* [Client side routing demo for all of the concepts in practice](http://basarat.com/takeme-demo)
* [HTML5 routing demo for all of the concepts in practice](http://basarat.com/takeme-demo/awesome/)

## What does it support

* Non Html5 mode: Simple `#/foo` = on match > (`beforeEnter` `enter` `beforeLeave`) management
* Html5 mode: Simple `/foo` = on match > (`beforeEnter` `enter` `beforeLeave`) management

> Why not any nesting routes? 

You can map `url` => `state` => `any arbitrary nesting of components` very easily and more maintainably in the long term instead of depending on hidden features of some library.

## Install 

```
npm install takeme --save
```

## Quick 

```js
import {Router, navigate, link} from 'takeme';

/**
 * The router takes an array of RouteConfig objects.
 */
const router = new Router([
  {
    $: '/foo',
    enter: () => {
      appState.fireTheMissiles();
    }
  }
]);

/** 
 * If you want to trigger some `beforeEnter` / `enter` (if it matches)
 */
router.init();

/** To nav. Just a thin wrapper on browser hash / pushstate (if supported) */
navigate('/foo');
/** or replace if pushstate is supported, if not its ignored magically */
navigate('/foo', true);

/** 
 * Use link to get a link. 
 * Just a thin wrapper that adds `#` to a given path
 * e.g. with JSX:
 **/
<a href={link('/foo')}>Take me to foo</a>
```

## Matching on $

### Parameters

Support `:param` for loading sections e.g

```js
{
  $: '/foo/:bar',
  enter: ({params}) => {
    console.log(params); // {bar:'somebar'} 🍻
  }
}

// User visits `/foo/somebar`
```
You can have as my params as you want e.g. `/foo/:bar/:baz`.

### Optional

Wrap any section with `()` to mark it as optional. e.g `/foo(/bar)`. In this case both `/foo` and `/foo/bar` match. To escape a `(` you can use a backslash e.g. `/foo\\(\\)` will only match the url `/foo()`.

### Wild card

`*` will match entire sections e.g. `/foo/*` will match `/foo/whatever/you/can/think/of`. The last matched `*` is placed in `params.splat`.

### Wild card greedy

`*` does not match greedily e.g. 

* `/*/c` does not match `/you/are/cool/c` as a single star only eats `/*/cool/c` and the trailing `ool/c` is unmatchd.

If you want such matching use the greedy `**` wildcard e.g.

* `/**/c` matches `/you/are/cool/c`. 

> The difference between `**` vs. `*` is only really evident when you want to match something inside i.e. `/*/c` (inside) vs. `/c/*` (end). In an end position they both behave the same.

## Handlers 

You can specify `beforeEnter`, `enter`, `beforeLeave` handlers. (Of course, you have TypeScript to guide you).

> Path: if `window.location.hash`:`#/foo`, in our lingo `path` is `/foo`.

Example of all these handlers: 

```js
{
  $: '/foo/',
  beforeEnter: ({oldPath, newPath, params}) => void | Promise<{ redirect: string, replace?: boolean }>,
  enter: ({oldPath, newPath, params}) => void,
  beforeLeave: ({oldPath, newPath}): void | false | Promise<{ redirect: string, replace?: boolean }>,
}
```

Lets look at these one by one.

### `beforeEnter` 
Triggered before calling `enter`. 

* This is your chance to go ahead and redirect the user if you want (e.g. if they are not logged in), just return `Promise.resolve({redirect:'/newPath'})`.
* Otherwise just return nothing and we will move on to `enter` (if any).

### `enter`
Yay, they made it. Use the `{oldPath, newPath, params}` to your hearts content.

### `beforeLeave`
The are about to leave. 

* If the `newPath` is not something you like, you can go ahead and return `false` to prevent them moving (be sure to let them know why by adding some notification to your state/UI).
* You can even go ahead and chose to redirect them elsewhere (return `Promise<{ redirect: string, replace?: boolean }>`).

## Ordering Routes
The router takes an array of `RouteConfig` objects. On a route change (browser hash change or pushstate event), we go through these routes one by one. So you can order the routes in decreasing priority e.g. error pages:

```js 
[
  { $: '/foo',
    enter: ()=>{ appState.current = 'foo' } },
  { $: '*', 
    enter: ()=>{ appState.current = 'notfound' } },
]
```

## Html5 Routing 
> Of course this assumes your server will return the same (index.html / application) file for any routes that you might be handling client side. 

* You can use takeme with html5 with a simple function call to `enableHtml5Routing`: 
```js
router.enableHtml5Routing().init();
```
You can even specify a `baseURL` e.g. 
```js
router.enableHtml5Routing('/awesome').init();
```

* You will need to create a `Link` component that makes browser click / navigate events to `history.pushState`. This is easy to do with the utility `html5LinkOnClick` e.g. for React:

```js
import { html5LinkOnClick } from 'takeme';
const Link: React.SFC<{ href: string, target?: string }> = (props) =>
  <a onClick={(e) => html5LinkOnClick({ event: e.nativeEvent })}
    href={props.href}
    target={props.target}
    children={props.children}
  />
```

## Complete Example Walkthrough
Here is the idea again. 
![URL -> Application State -> Your View](https://raw.githubusercontent.com/basarat/takeme/master/docs/uni-directional.png)

Lets break down this image into its portions. First the URL to Application State flow. 

![URL -> Application State](https://raw.githubusercontent.com/basarat/takeme/master/docs/00-url-state.png)

We define our links and application state and the transform from (`url -> state`) as a config to the router:

```js
import { navigate, Router } from 'takeme';

// URLs
export const links = {
  login: () => '/login',
  profile: (id: string) => `/profile/${id}`,
}

// State 
export type Route = 'login' | 'profile';
export class RouteState {
  @observable route: Route = 'login';

  @action setRoute(route: Route) {
    this.route = route;
  }

  @observable loggedIn = false;
  @observable loginRequiredMessage: string = '';
  @action setLoginRequiredMessage(message: string) {
    this.loginRequiredMessage = message;
  }
  @action login() {
    this.loggedIn = true;
    this.loginRequiredMessage = ''
  }
  @action logout() {
    this.loggedIn = false;
    navigate(links.login());
  }

  @observable profileId: string;
  @action setProfile(profileId: string) {
    this.profileId = profileId;
  }
}

export const routeState = new RouteState();

// Map URL to State 
export const router = new Router([
  {
    $: links.login(),
    enter: () => routeState.setRoute('login')
  },
  {
    $: links.profile(':profileId'),
    enter: ({ params: { profileId } }) => {
      routeState.setRoute('profile');
      routeState.setProfile(profileId);
    },
    beforeEnter: () => {
      if (!routeState.loggedIn) {
        routeState.setLoginRequiredMessage('You need to login before you can visit a profile page');
        return { redirect: links.login() };
      }
    },
  },
  { $: '*', enter: () => routeState.setRoute('login') },
]).init();
```
Great now we have a nice flow from `url -> appliaction state`. Next up is the `state -> view`. 

![Application State -> View](https://raw.githubusercontent.com/basarat/takeme/master/docs/01-state-view.png). 

As `state` is `mobx observable`, it's easy to do with a `mobx observer` e.g. for React: 

```js
/**
 * Pages
 */
export const Login = observer(() =>
  <Vertical>
    <h3>Login Page</h3>
    {!routeState.loggedIn && <Button onClick={() => routeState.login()}>Click here to login</Button>}
    {routeState.loggedIn && <AlertSuccess>You are logged in! Visit some profile page :)</AlertSuccess>}
    {routeState.loginRequiredMessage && <Alert>{routeState.loginRequiredMessage}</Alert>}
    <Nav />
  </Vertical>
);

export const Profile = observer(({ profileId }: { profileId: string }) =>
  <Vertical>
    <h3>Profile of : {profileId}</h3>
    <Nav />
  </Vertical>
);

/**
 * Application State -> Page
 */
const Page = observer(() => {
  switch (routeState.route) {
    case 'login': return <Login />;
    case 'profile': return <Profile profileId={routeState.profileId} />
    default:
      const _ensure: never = routeState.route;
      return <noscript />
  }
});
```

Now we have the complete working path: 

![URL -> Application State -> View](https://raw.githubusercontent.com/basarat/takeme/master/docs/02-url-state-view.png). 

The return path (dispatch path) is handled by the router (can be user clicking a `link`, or browser history navigation, or you can call `navigate` yourself), it will trigger any handlers registered giving a very deterministic and maintainable application logic:

```
url 
-handlers cause change in -> 
  state 
    -mobx causes re-rendering of-> view
```

## Tips
Here are some tips. Few of these are really tied to us, but its good to have helpful guidance so here it is.

### Lazy loading
Just use the JavaScript patterns you know and love e.g. with webpack.

```js
{
  $: '/foo/',
  enter: () => { 
    require.ensure(['banana','monkey-holding-the-banana','the-jungle'], ()=>{
      // your app logic
    });
  }
}
```

### Uni-Directional
Now that we have the entire simple API covered, let's talk a bit more about patterns (🕊️ and 🐝). The simplest way to do it is simply to follow the `url -> state -> view` pattern. You can use something like `mobx` or `redux` for `state -> view` pattern. 

* Browser's back / next buttons, or clicking on any link that changes the url will automatically trigger an event we already register to and we map them to the hooks as need. You don't need to do anything here.
* Users actions like a `goToPayment()` action can follow the same pattern as the user clicking the link by simply calling `router.navigate('/payment')` (we just use pushstate or hash change based on detected browser support).

Sweet, its all `url => someHookYouUseToChangeState` ❤️️.

### Managing links
Links are just `string`. I like to know which are the ones in the app, and keep them easy to maintain (thank to TypeScript). I normally have a file `links.ts` with: 

```js
export const links = {
  login: () => '/login',
  profile: (id: string) => `/profile/${id}`
}
```

This file is my single source of truth.

* I configure my routing using these functions: 

```
const router = new Router([
  {
    $: links.login(),
    enter:()=>{ /* do your state thing */ }
  },
  {
    $: links.profile(':profileId'),
    enter:({params})=>{ /* do your state thing with `params.profileId` */ }
  },
]);
```

* All calls to `navigate` also use `links` e.g. `navigate(links.profile('dave'))`. 
* For `a` tags, use `link` with `links` e.g. with JSX:

```js
<a href={link(links.profile(user.id))}>{user.name}</a>
```

* For reminder emails (and other static assets) generate the template files using `links`: 

```js
const websiteRoot = 'https://www.github.com/'
const templateVars = {
  userId: '{{userId}}'
};
const link = websiteRoot + link(links.profile(templateVars));
```
* If you have html5Routing enabled (even with a `baseUrl` setup) you do not need to change your links at all as it is handled by the utility `link`/`navigate`/`html5LinkOnClick` methods. This keeps your link / router config independent of any (server side / server side baseUrl / client side) setup.  

Of course you can use this `links.ts` in your dynamic server code as well. This way you don't get bad link refactorings (magic strings).
