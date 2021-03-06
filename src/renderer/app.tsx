import { ipcRenderer, IpcMessageEvent } from 'electron';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { AppRouter, IAppRouterProps } from './router';
import { TitleBar } from './components/TitleBar';
import { ICentralState } from './interfaces';
import * as AppConstants from '../shared/AppConstants';
import { IGameOrderChangeEvent } from './components/GameOrder';
import { BrowsePageLayout } from '../shared/BrowsePageLayout';
import { GameImageCollection } from './image/GameImageCollection';
import { GamePlaylistManager } from './playlist/GamePlaylistManager';
import GameManager from './game/GameManager';
import { IGameInfo } from '../shared/game/interfaces';
import { IGamePlaylist } from './playlist/interfaces';
import { SearchQuery } from './store/search';
import HeaderContainer from './containers/HeaderContainer';
import { WithPreferencesProps } from './containers/withPreferences';
import { ConnectedFooter } from './containers/ConnectedFooter';

interface IAppOwnProps {
  search: SearchQuery;
}

export type IAppProps = IAppOwnProps & RouteComponentProps & WithPreferencesProps;

export interface IAppState {
  central: ICentralState;
  order?: IGameOrderChangeEvent;
  /** Scale of games at the browse page */
  gameScale: number;
  /** Layout of the browse page */
  gameLayout: BrowsePageLayout;
  /** Currently selected game (if any) */
  selectedGame?: IGameInfo;
  /** Currently selected playlist (if any) */
  selectedPlaylist?: IGamePlaylist;
  /** If the "New Game" button was clicked (silly way of passing the event from the footer the the browse page) */
  wasNewGameClicked: boolean;
}

export class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);
    // Normal constructor stuff
    const preferencesData = this.props.preferencesData;
    const config = window.External.config;
    this.state = {
      central: {
        games: new GameManager(),
        gameImages: new GameImageCollection(config.fullFlashpointPath),
        playlists: new GamePlaylistManager(),
        gamesDoneLoading: false,
        gamesFailedLoading: false,
        playlistsDoneLoading: false,
        playlistsFailedLoading: false,
      },
      gameScale: preferencesData.browsePageGameScale,
      gameLayout: preferencesData.browsePageLayout,
      wasNewGameClicked: false,
    };
    this.onOrderChange = this.onOrderChange.bind(this);
    this.onScaleSliderChange = this.onScaleSliderChange.bind(this);
    this.onLayoutSelectorChange = this.onLayoutSelectorChange.bind(this);
    this.onNewGameClick = this.onNewGameClick.bind(this);
    this.onToggleLeftSidebarClick = this.onToggleLeftSidebarClick.bind(this);
    this.onToggleRightSidebarClick = this.onToggleRightSidebarClick.bind(this);
    this.onSelectGame = this.onSelectGame.bind(this);
    this.onSelectPlaylist = this.onSelectPlaylist.bind(this);
    // Initialize app
    this.init();
  }

  init() {
    // Listen for the window to move or resize (and update the preferences when it does)
    ipcRenderer.on('window-move', (sender: IpcMessageEvent, x: number, y: number, isMaximized: boolean) => {
      if (!isMaximized) {
        const mw = this.props.preferencesData.mainWindow;
        mw.x = x | 0;
        mw.y = y | 0;
      }
    });
    ipcRenderer.on('window-resize', (sender: IpcMessageEvent, width: number, height: number, isMaximized: boolean) => {
      if (!isMaximized) {
        const mw = this.props.preferencesData.mainWindow;
        mw.width  = width  | 0;
        mw.height = height | 0;
      }
    });
    ipcRenderer.on('window-maximize', (sender: IpcMessageEvent, isMaximized: boolean) => {
      this.props.preferencesData.mainWindow.maximized = isMaximized;
    });
    // Load Playlists
    this.state.central.playlists.load()
    .catch((err) => {
      this.setState({
        central: Object.assign({}, this.state.central, {
          playlistsDoneLoading: true,
          playlistsFailedLoading: true,
        })
      });
      window.External.log.addEntry({
        source: 'Launcher',
        content: err+''
      });
      throw err;
    })
    .then(() => {
      this.setState({
        central: Object.assign({}, this.state.central, {
          playlistsDoneLoading: true,
        })
      });
    });
    // Fetch LaunchBox game data from the xml
    this.state.central.games.findPlatforms()
    .then((filenames) => {
      // Prepare images
      const platforms: string[] = filenames.map((platform) => platform.split('.')[0]); // ('Flash.xml' => 'Flash')
      this.state.central.gameImages.addPlatforms(platforms);
      // Load and parse platform XMLs
      this.state.central.games.loadPlatforms()
      .then(() => {
        this.setState({
          central: Object.assign({}, this.state.central, {
            gamesDoneLoading: true,
          })
        });
      })
      .catch((error) => {
        console.error(error);
        this.setState({
          central: Object.assign({}, this.state.central, {
            gamesDoneLoading: true,
            gamesFailedLoading: true,
          })
        });
      });
    })
    .catch((error) => {
      console.error(error);
      this.setState({
        central: Object.assign({}, this.state.central, {
          gamesDoneLoading: true,
          gamesFailedLoading: true,
        })
      });
    });
  }

  componentDidMount() {
    // Request all log entires
    window.External.log.refreshEntries();
  }

  componentDidUpdate(prevProps: IAppProps, prevState: IAppState) {
    if (prevState.wasNewGameClicked) {
      this.setState({ wasNewGameClicked: false });
    }
  }

  render() {
    // Get game count (or undefined if no games are yet found)
    let gameCount: number|undefined;
    if (this.state.central.gamesDoneLoading) {
      gameCount = this.state.central.games.collection.games.length;
    }
    // Props to set to the router
    const routerProps: IAppRouterProps = {
      central: this.state.central,
      order: this.state.order,
      gameScale: this.state.gameScale,
      gameLayout: this.state.gameLayout,
      selectedGame: this.state.selectedGame,
      selectedPlaylist: this.state.selectedPlaylist,
      onSelectGame: this.onSelectGame,
      onSelectPlaylist: this.onSelectPlaylist,
      wasNewGameClicked: this.state.wasNewGameClicked,
    };
    // Render
    return (
      <>
        {/* "TitleBar" stuff */}
        { window.External.config.data.useCustomTitlebar ? (
          <TitleBar title={`${AppConstants.appTitle} (${AppConstants.appVersionString})`} />
        ) : undefined }
        {/* "Header" stuff */}
        <HeaderContainer onOrderChange={this.onOrderChange}
                         onToggleLeftSidebarClick={this.onToggleLeftSidebarClick}
                         onToggleRightSidebarClick={this.onToggleRightSidebarClick} />
        {/* "Main" / "Content" stuff */}
        <div className='main'>
          <AppRouter {...routerProps} />
          <noscript className='nojs'>
            <div style={{textAlign:'center'}}>
              This website requires JavaScript to be enabled.
            </div>
          </noscript>
        </div>
        {/* "Footer" stuff */}
        <ConnectedFooter gameCount={gameCount}
                         onScaleSliderChange={this.onScaleSliderChange} scaleSliderValue={this.state.gameScale}
                         onLayoutChange={this.onLayoutSelectorChange} layout={this.state.gameLayout}
                         onNewGameClick={this.onNewGameClick} />
      </>
    );
  }

  private onOrderChange(event: IGameOrderChangeEvent): void {
    this.setState({ order: event });
  }

  private onScaleSliderChange(value: number): void {
    this.setState({ gameScale: value });
    // Update Preferences Data (this is to make it get saved on disk)
    this.props.updatePreferences({ browsePageGameScale: value });
  }

  private onLayoutSelectorChange(value: BrowsePageLayout): void {
    this.setState({ gameLayout: value });
    // Update Preferences Data (this is to make it get saved on disk)
    this.props.updatePreferences({ browsePageLayout: value });
  }

  private onNewGameClick(): void {
    this.setState({
      wasNewGameClicked: true,
      selectedGame: undefined
    });
  }

  private onToggleLeftSidebarClick(): void {
    this.props.updatePreferences({ browsePageShowLeftSidebar: !this.props.preferencesData.browsePageShowLeftSidebar });
    this.forceUpdate();
  }

  private onToggleRightSidebarClick(): void {
    this.props.updatePreferences({ browsePageShowRightSidebar: !this.props.preferencesData.browsePageShowRightSidebar });
    this.forceUpdate();
  }

  private onSelectGame(game?: IGameInfo): void {
    this.setState({ selectedGame: game });
  }

  private onSelectPlaylist(playlist?: IGamePlaylist): void {
    this.setState({
      selectedPlaylist: playlist,
      selectedGame: undefined,
    });
  }
}
