import { ReactNode } from 'react';
import { GameImageCollection } from './image/GameImageCollection';
import { GamePlaylistManager } from './playlist/GamePlaylistManager';
import GameManager from './game/GameManager';

/** "match" object from 'react-router' and 'history' npm packages */
export interface IMatch {
  /** Key/value pairs parsed from the URL corresponding to the dynamic segments of the path */
  params: any;
  /** true if the entire URL was matched (no trailing characters) */
  isExact: boolean;
  /** The path pattern used to match. Useful for building nested <Route>s */
  path: string;
  /** The matched portion of the URL. Useful for building nested <Link>s */
  url: string;
}

export interface IDefaultProps {
  children?: ReactNode;
}

/**
 * An object that contains useful stuff and is passed throughout the react app as a prop/state
 * (This should be temporary and used for quick and dirty testing and implementation)
 * (Replace this with something more thought out and maintainable once the project has more structure)
 */
export interface ICentralState {
  /** All playlists */
  games: GameManager;
  /** Lookup table for all games images filenames */
  gameImages: GameImageCollection;
  /** All playlists */
  playlists: GamePlaylistManager;
  /** If the game collection is done loading */
  gamesDoneLoading: boolean;
  /** If the game collection failed to load */
  gamesFailedLoading: boolean;
  /** If the playlist collection is done loading */
  playlistsDoneLoading: boolean;
  /** If the playlist failed to load */
  playlistsFailedLoading: boolean;
}

/**
 * State of the current search.
 */
export interface SearchState {
  input: string;
}
