import { ComponentEx, connect, translate } from '../../../util/ComponentEx';
import { showError } from '../../../util/message';
import { activeGameId, activeProfile, currentGameDiscovery } from '../../../util/selectors';
import Advanced from '../../../views/Advanced';
import ToolbarIcon from '../../../views/ToolbarIcon';

import { IDiscoveryResult } from '../../gamemode_management/types/IDiscoveryResult';
import { currentActivator, installPath } from '../../mod_management/selectors';
import { IProfileMod } from '../../profile_management/types/IProfile';

import { IMod } from '../types/IMod';
import { IModActivator } from '../types/IModActivator';

import { deactivateMods } from '../modActivation';

import * as React from 'react';
import { generate as shortid } from 'shortid';

interface IConnectedProps {
  installPath: string;
  gameDiscovery: IDiscoveryResult;
  mods: { [id: string]: IMod };
  modState: { [id: string]: IProfileMod };
  currentActivator: string;
}

interface IActionProps {
  onShowError: (message: string, details?: string) => void;
}

export interface IBaseProps {
  activators: IModActivator[];
  buttonType: 'text' | 'icon' | 'both';
}

type IProps = IBaseProps & IConnectedProps & IActionProps;

class DeactivationButton extends ComponentEx<IProps, {}> {
  public render(): JSX.Element {
    const { t, buttonType } = this.props;

    return (
      <Advanced><ToolbarIcon
        id='activate-mods'
        icon='chain-broken'
        text={t('Purge Mods')}
        onClick={this.activate}
        buttonType={buttonType}
      /></Advanced>
    );
  }

  private activate = () => {
    const { t, activators, currentActivator, gameDiscovery, installPath, onShowError } = this.props;

    const activator: IModActivator = currentActivator !== undefined
      ? activators.find((act: IModActivator) => act.id === currentActivator)
      : activators[0];

    const notificationId = shortid();
    this.context.api.sendNotification({
      id: notificationId,
      type: 'activity',
      message: t('Purging mods'),
      title: t('Purging'),
    });

    deactivateMods(installPath, gameDiscovery.modPath, activator).catch((err) => {
      onShowError('failed to deactivate mods', err.message);
    }).finally(() => {
      this.context.api.dismissNotification(notificationId);
    });
  }
}

function mapStateToProps(state: any): IConnectedProps {
  const profile = activeProfile(state);
  const gameMode = activeGameId(state);

  return {
    installPath: installPath(state),
    gameDiscovery: currentGameDiscovery(state),
    mods: state.persistent.mods[gameMode] || {},
    modState: profile !== undefined ? profile.modState : {},
    currentActivator: currentActivator(state),
  };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<any>): IActionProps {
  return {
    onShowError: (message: string, details?: string) => showError(dispatch, message, details),
  };
}

export default
  translate(['common'], { wait: false })(
    connect(mapStateToProps, mapDispatchToProps)(DeactivationButton),
  ) as React.ComponentClass<IBaseProps>;
