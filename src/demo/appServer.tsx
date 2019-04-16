/** Normalize JS */
import "core-js";
/** Normaize CSS */
import { normalize } from "csstips";
normalize();
import { forceRenderStyles, cssRaw } from 'typestyle';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { routeState } from './routeState';
import { observer } from 'mobx-react';
import { router } from './router';
import { link, html5LinkOnClick } from '../index';
import { links } from './links';

/** 
 * You create your own link component
 */
const Link: React.SFC<{ href: string, target?: string }> = (props) =>
  <a onClick={(e) => html5LinkOnClick({ event: e.nativeEvent })}
    href={props.href}
    target={props.target}
    children={props.children}
  />

/** 
 * Some page CSS customizations.
 * Note: Creating componentized CSS would detract from the points of the demo
 */
cssRaw(`
#root {
  padding: 10px;
}
`);
import { Button, Alert, Vertical, Horizontal, AlertSuccess } from './ui/components';

/**
 * A sample nav
 */
export const Nav = observer(() => {
  return <Vertical>
    {routeState.loggedIn && <Horizontal>
      <Link href={link(links.profile('dave'))}>Dave</Link>
      <Link href={link(links.profile('john'))}>John</Link>
    </Horizontal>}

    {routeState.loggedIn && <Button onClick={() => routeState.logout()}>Logout</Button>}

    <Horizontal>
      <Link href={'https://github.com/basarat/takeme/tree/master/src/demo'} target="_blank">Code for the demo</Link>
      <Link href={'http://basarat.com/takeme'} target="_blank">takeme Docs</Link>
      <Link href={'https://github.com/basarat/takeme'} target="_blank">Star it on github ⭐</Link>
    </Horizontal>
  </Vertical>;
});

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
 * Route -> Page
 */
const Page = observer(() => {
  switch (routeState.route.type) {
    case 'login': return <Login />;
    case 'profile': return <Profile profileId={routeState.route.profileId} />
    default:
      const _ensure: never = routeState.route;
      return <noscript />
  }
});

/**
 * Kickoff
 */
ReactDOM.render(<Page />, document.getElementById('root'))
router.enableHtml5Routing('/takeme-demo/awesome').init();
forceRenderStyles();