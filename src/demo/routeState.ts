import { observable, action } from 'mobx';
import { navigate } from '../index';
import { links } from './links';

export type Route =
  | { type: 'login' }
  | { type: 'profile', profileId: string };

export class RouteState {
  @observable route: Route = {
    type: 'login'
  };

  @action setRoute(route: Route) {
    this.route = route;
  }

  @observable loggedIn = false;
  @action login() {
    this.loggedIn = true;
    this.loginRequiredMessage = ''
  }
  @action logout() {
    this.loggedIn = false;
    navigate(links.login());
  }

  @observable loginRequiredMessage: string = '';
  @action setLoginRequiredMessage(message: string) {
    this.loginRequiredMessage = message;
  }
}

export const routeState = new RouteState();
