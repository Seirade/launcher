import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { ICentralState } from './interfaces';
import { AboutPage } from './components/pages/AboutPage';
import { IGameOrderChangeEvent } from './components/GameOrder';
import { Paths } from './Paths';
import { BrowsePageLayout } from '../shared/BrowsePageLayout';
import { IGameInfo } from '../shared/game/interfaces';
import { IGamePlaylist } from './playlist/interfaces';
import ConnectedBrowsePage, { IConnectedBrowsePageProps } from './containers/ConnectedBrowsePage';
import { ConnectedConfigPage } from './containers/ConnectedConfigPage';
import { ConnectedHomePage } from './containers/ConnectedHomePage';
import { ConnectedLogsPage } from './containers/ConnectedLogsPage';

export interface IAppRouterProps {
  central: ICentralState;
  order?: IGameOrderChangeEvent;
  gameScale: number;
  gameLayout: BrowsePageLayout;
  selectedGame?: IGameInfo;
  selectedPlaylist?: IGamePlaylist;
  onSelectGame?: (game?: IGameInfo) => void;
  onSelectPlaylist?: (playlist?: IGamePlaylist) => void;
  wasNewGameClicked: boolean;
}

export class AppRouter extends React.Component<IAppRouterProps, {}> {
  render() {
    const browseProps: IConnectedBrowsePageProps = {
      central: this.props.central,
      order: this.props.order,
      gameScale: this.props.gameScale,
      gameLayout: this.props.gameLayout,
      selectedGame: this.props.selectedGame,
      selectedPlaylist: this.props.selectedPlaylist,
      onSelectGame: this.props.onSelectGame,
      onSelectPlaylist: this.props.onSelectPlaylist,
      wasNewGameClicked: this.props.wasNewGameClicked,
    };
    return (
      <Switch>
        <PropsRoute exact path={Paths.home} component={ConnectedHomePage}
                    central={this.props.central} onSelectPlaylist={this.props.onSelectPlaylist} />
        <PropsRoute path={Paths.browse} component={ConnectedBrowsePage}
                    {...browseProps} />
        <PropsRoute path={Paths.logs} component={ConnectedLogsPage} />
        <PropsRoute path={Paths.config} component={ConnectedConfigPage} />
        <Route path={Paths.about} component={AboutPage} />
        <Route component={NotFoundPage} />
      </Switch>
    );
  }
}

// Reusable way to pass properties down a router and to its component
const renderMergedProps = (component: any, ...rest: any[]) => {
  const finalProps = Object.assign({}, ...rest);
  return (
    React.createElement(component, finalProps)
  );
}
const PropsRoute = ({ component, ...rest }: any) => {
  return (
    <Route {...rest} render={routeProps => {
      return renderMergedProps(component, routeProps, rest);
    }}/>
  );
}
