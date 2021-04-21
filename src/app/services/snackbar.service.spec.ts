import { TestBed, tick, fakeAsync, waitForAsync } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { SnackbarService } from './snackbar.service';
import { RequiredModules } from '../modules/required.module';
import { AngularMaterialModule } from '../modules/angular-material/angular-material.module';

import { AppSnackBarInnerComponent } from '../components/app-snack-bar-inner/app-snack-bar-inner.component';
import { ConstantsService } from './constants.service';
import { delay } from 'rxjs/operators';
import { of } from 'rxjs';
import { IPopupModel } from '../models/snackbar.model';

describe('SnackbarService', () => {
  let service: SnackbarService;
  const testMessage = { message: `Message: Test`, class: 'popup__info' };
  const calcDelay = () => ConstantsService.snackbarDuration * (testMessage.class === 'popup__error' ? 2 : 1);
  const refStub = of({ dismissedByAction: false }).pipe(delay(calcDelay()));
  const mockRef = (data: IPopupModel): any => {
    return {
      afterDismissed() {
        return refStub;
      },
    };
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AppSnackBarInnerComponent],
        imports: [RequiredModules, AngularMaterialModule],
        providers: [SnackbarService],
      })
        .overrideModule(BrowserDynamicTestingModule, {
          set: {
            entryComponents: [AppSnackBarInnerComponent],
          },
        })
        .compileComponents();
    })
  );

  beforeEach(waitForAsync(() => {
      service = TestBed.inject(SnackbarService);
    })
  );

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should manage message queue', fakeAsync(() => {
    // const spy = spyOn(service, 'ref').and.callThrough();
    const spy = spyOn(service, 'ref').and.callFake(mockRef);

    // Setting 3 elements
    service.show({ ...testMessage, ...{ message: `Message: Test 1` } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(service.q.length).toBe(1);
    service.show({ ...testMessage, ...{ message: `Message: Test 2` } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(service.q.length).toBe(2);
    service.show({ ...testMessage, ...{ message: `Message: Test 3` } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(service.q.length).toBe(3);

    // tail delay
    tick(calcDelay() + 100);
    expect(service.q.length).toBe(2);
    tick(calcDelay() + 100);
    expect(service.q.length).toBe(1);
    tick(calcDelay() + 100);
    expect(service.q.length).toBe(0);
  }));
});
