import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { SetStatusAway, SetStatusBuildInfo, SetStatusConnected, SetStatusShowLoading, SetStatusUpdatesAvailable } from '../states/app.actions';
import { AppStatusState } from '../states/app.state';
import { ConstantsService } from './constants.service';
import { OwmDataManagerService } from './owm-data-manager.service';
import { SnackbarService } from './snackbar.service';
import { PresenceService } from './presence.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  subscriptions: Subscription;

  constructor(
    private _router: Router,
    private _presence: PresenceService,
    private _updates: SwUpdate,
    private _store: Store,
    private _owmDataManager: OwmDataManagerService,
    private _snackbarService: SnackbarService,
    @Inject(DOCUMENT) private _document: Document,
  ) {
    this.initCss();
    this.setSubscribeOnRouterEvents();
    this.setSubscribeOnConnected();
    this.startListenerOnAway();
    this.setSubscribeOnUpdates();
  }

  initCss() {
    ConstantsService.initCssIconsList.forEach((property) => {
      this._document.documentElement.style.setProperty(`--${property}Url`, `url("../../../${ConstantsService[property]}")`);
    });
    ConstantsService.initCssShowPropertiesList.forEach((property) => {
      const display = this._store.selectSnapshot(AppStatusState[property]) && 'flex' || 'none';
      this._document.documentElement.style.setProperty('--' + property, display);
    });
  }

  setSubscribeOnUpdates() {
    this.subscriptions.add(
      this._updates.available.subscribe((event) => {
        console.log('Current version:', event.current);
        console.log('New available version:', event.available);
        this._store.dispatch(new SetStatusUpdatesAvailable(true));
        const buildInfo = {
          current: (event.current?.appData as any)?.buildInfo,
          available: (event.available?.appData as any)?.buildInfo
        };
        this._store.dispatch(new SetStatusBuildInfo(buildInfo));
      })
    );
  }

  startListenerOnAway() {
    const fn = () => {
      const away = this._document.visibilityState === 'hidden';
      this._store.dispatch(new SetStatusAway(away));
    };
    this._presence.updateOnAway(fn);
  }

  setSubscribeOnConnected() {
    this.subscriptions.add(
      this._presence.updateOnConnected().subscribe((connected) => {
        console.log('AppComponent connected', connected);
        this._store.dispatch(new SetStatusConnected(!!connected));
      })
    );
  }

  setSubscribeOnRouterEvents() {
    this.subscriptions = this._router.events.subscribe((routerEvent: Event) => {
      this.checkRouterEvent(routerEvent);
    });
  }

  checkRouterEvent(routerEvent: Event) {
    if (routerEvent instanceof NavigationStart) {
      this._store.dispatch(new SetStatusShowLoading(true));
    } else {
      this._store.dispatch(new SetStatusShowLoading(false));
    }
  }

  shutdown() {
    this._store.dispatch(new SetStatusConnected(false));
    this._store.dispatch(new SetStatusAway(false));
    this.subscriptions.unsubscribe();
  }

}
