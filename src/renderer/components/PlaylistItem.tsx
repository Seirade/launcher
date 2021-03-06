import * as React from 'react';
import { IGamePlaylist, IGamePlaylistEntry } from '../playlist/interfaces';
import { deepCopy } from '../../shared/Util';
import { ConfirmButton } from './ConfirmButton';
import { ICentralState } from '../interfaces';
import { IGameInfo } from '../../shared/game/interfaces';
import { GameCollection } from '../../shared/game/GameCollection';
import { GameLauncher } from '../GameLauncher';
import { OpenIcon } from './OpenIcon';
import { EditableTextElement, IEditableTextElementArgs } from './EditableTextElement';
import { gameIdDataType } from '../Util';

export interface IPlaylistItemProps {
  playlist: IGamePlaylist;
  expanded?: boolean;
  editing?: boolean;
  editingDisabled?: boolean;
  central: ICentralState;
  onHeadClick?: (playlist: IGamePlaylist) => void;
  onEditClick?: (playlist: IGamePlaylist) => void;
  onDeleteClick?: (playlist: IGamePlaylist) => void;
  onSaveClick?: (playlist: IGamePlaylist, edit: IGamePlaylist) => void;
  onDrop?: (event: React.DragEvent, playlist: IGamePlaylist) => void;
  onDragOver?: (event: React.DragEvent, playlist: IGamePlaylist) => void;
}

export interface IPlaylistItemState {
  /** If any unsaved changes has been made to the playlist (the buffer) */
  hasChanged: boolean;
  /** Buffer for the playlist (stores all changes are made to it until edit is saved) */
  editPlaylist?: IGamePlaylist;
  /** If something is being dragged over this element */
  dragOver: boolean;
}

export class PlaylistItem extends React.Component<IPlaylistItemProps, IPlaylistItemState> {
  //
  private onTitleEditDone        = this.wrapOnEditDone((edit, text) => { edit.title = text; });
  private onAuthorEditDone       = this.wrapOnEditDone((edit, text) => { edit.author = text; });
  private onDescriptionEditDone  = this.wrapOnEditDone((edit, text) => { edit.description = text; });
  //
  private renderTitle  = this.wrapRenderEditableText('No Title', 'Title...');
  private renderAuthor = this.wrapRenderEditableText('No Author', 'Author...');
  //
  private contentRef: React.RefObject<HTMLDivElement> = React.createRef();
  private contentHeight: number = 0;
  private updateContentHeightInterval: number = -1;
  //
  private _wrapper: React.RefObject<HTMLDivElement> = React.createRef();
  private width: number = 0;
  private height: number = 0;

  constructor(props: IPlaylistItemProps) {
    super(props);
    this.state = {
      hasChanged: false,
      dragOver: false,
    };
    this.onHeadClick = this.onHeadClick.bind(this);
    this.onIconClick = this.onIconClick.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onSaveClick = this.onSaveClick.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onAddGameDone = this.onAddGameDone.bind(this);
    this.onDoubleClickGame = this.onDoubleClickGame.bind(this);
    this.renderDescription = this.renderDescription.bind(this);
  }

  componentDidMount() {
    this.updateContentHeight();
    this.updateEdit();
    this.updateCssVars();
    this.updateContentHeightInterval = window.setInterval(() => {
      if (this.props.expanded) {
        if (this.updateContentHeight()) { this.forceUpdate(); }
      }
    }, 150);
    if (this.props.expanded) { this.forceUpdate(); }
  }

  componentDidUpdate(prevProps: IPlaylistItemProps, prevState: IPlaylistItemState) {
    this.updateContentHeight();
    this.updateEdit();
    this.updateCssVars();
  }

  componentWillUnmount() {
    window.clearInterval(this.updateContentHeightInterval);
  }

  render() {
    // Normal rendering stuff
    const playlist = this.state.editPlaylist || this.props.playlist;
    const expanded = !!this.props.expanded;
    const editingDisabled = !!this.props.editingDisabled;
    const editing = !editingDisabled && !!this.props.editing;
    let className = 'playlist-list-item';
    if (expanded) { className += ' playlist-list-item--selected' }
    if (editing)  { className += ' playlist-list-item--editing' }
    if (this.state.dragOver) { className += ' playlist-list-item--drag-over' }
    const maxHeight = this.props.expanded && this.contentHeight || undefined;
    return (
      <div className={className} onDrop={this.onDrop} onDragOver={this.onDragOver}
           onDragEnter={this.onDragEnter} onDragLeave={this.onDragLeave}>
        {/* Drag Overlay */}
        <div className='playlist-list-item__drag-overlay' />
        {/* Head */}
        <div className='playlist-list-item__head' onClick={(!editing)?this.onHeadClick:undefined}>
          {(playlist.icon) ? (
            <div className='playlist-list-item__head__icon'>
              <div className='playlist-list-item__head__icon__image'
                   style={{ backgroundImage: playlist.icon ? `url('${playlist.icon}')` : undefined }}
                   onClick={this.onIconClick} />
            </div>
          ) : (
            <div className='playlist-list-item__head__icon simple-center' onClick={this.onIconClick}>
              <div className='playlist-list-item__head__icon__no-image simple-center__inner'>
                <OpenIcon icon='question-mark' className='playlist-list-item__head__icon__no-image__icon' />
              </div>
            </div>
          )}
          <div className='playlist-list-item__head__title simple-center'>
            <EditableTextElement text={playlist.title} onEditConfirm={this.onTitleEditDone}
                                 editable={editing} children={this.renderTitle} />
          </div>
          { editing || playlist.author ? (
            <>
              <div className='playlist-list-item__head__divider simple-center'>
                <p className='simple-center__inner'>by</p>
              </div>
              <div className='playlist-list-item__head__author simple-center'>
                <EditableTextElement text={playlist.author} onEditConfirm={this.onAuthorEditDone}
                                     editable={editing} children={this.renderAuthor} />
              </div>    
            </>
          ) : undefined }
        </div>
        {/* Content */}
        <div className='playlist-list-item__content' ref={this.contentRef}
             style={{ maxHeight }}>
          <div className='playlist-list-item__content__inner'>
            { editingDisabled ? undefined : (
              <div className='playlist-list-item__content__edit'>
                <div className='playlist-list-item__content__id'>
                  <p className='playlist-list-item__content__id__pre'>ID: </p>
                  <div className='playlist-list-item__content__id__text'>
                    <p>{playlist.id}</p>
                  </div>
                </div>
                <div className='playlist-list-item__content__buttons'>
                  {/* Save Button */}
                  { editing ? (
                    <input type='button' value='Save' className='simple-button'
                           title='Save changes made and stop editing'
                           onClick={this.onSaveClick} disabled={!this.state.hasChanged} />
                  ) : undefined }
                  {/* Edit / Discard Button */}
                  { editing ? (
                    <ConfirmButton props={{ value: 'Discard', title: 'Discard the changes made and stop editing',
                                            className: 'simple-button', }}
                                   confirm={{ value: 'Are you sure?',
                                              className: 'simple-button simple-button--red simple-vertical-shake', }}
                                   skipConfirm={!this.state.hasChanged}
                                   onConfirm={this.onEditClick} />
                  ) : (
                    <input type='button' value='Edit' className='simple-button'
                           title='Start editing this playlist'
                           onClick={this.onEditClick} />
                  ) }
                  {/* Delete Button */}
                  <ConfirmButton props={{ value: 'Delete', title: 'Delete this playlist', className: 'simple-button', }}
                                 confirm={{ value: 'Are you sure?',
                                            className: 'simple-button simple-button--red simple-vertical-shake', }}
                                 onConfirm={this.onDeleteClick} />
                </div>
              </div>
            ) }
            {/* Description */}
            <EditableTextElement text={playlist.description} onEditConfirm={this.onDescriptionEditDone}
                                 editable={editing} children={this.renderDescription} />
          </div>
        </div>
      </div>
    );
  }

  private wrapRenderEditableText(placeholderText: string, placeholderEdit: string) {
    return function(o: IEditableTextElementArgs) {
      if (o.editing) {
        return (
        <input value={o.text} placeholder={placeholderEdit}
               onChange={o.onInputChange} onKeyDown={o.onInputKeyDown} 
               autoFocus onBlur={o.cancelEdit}
               className='playlist-list-item__editable-text simple-vertical-inner simple-input' />
        );
      } else {
        let className = 'playlist-list-item__editable-text simple-vertical-inner';
        if (!o.text) { className += ' simple-disabled-text'; }
        return (
          <p onClick={o.startEdit} title={o.text} className={className}>
            {o.text || placeholderText}
          </p>
        );
      }
    };
  }
  
  private renderDescription(o: IEditableTextElementArgs) {
    if (o.editing) {
      return (
        <textarea value={o.text} placeholder='Enter a description here...'
                  onChange={o.onInputChange} onKeyDown={o.onInputKeyDown}
                  autoFocus onBlur={o.cancelEdit}
                  className='playlist-list-item__content__description-edit playlist-list-item__editable-text simple-input simple-scroll' />
      );
    } else {
      let className = 'playlist-list-item__content__description-text';
      if (!o.text) { className += ' simple-disabled-text'; }
      return (
        <p onClick={o.startEdit} className={className}>
          {o.text || '< No Description >'}
        </p>
      );
    }
  }

  private updateContentHeight(): boolean {
    if (this.contentRef.current) {
      const oldHeight = this.contentHeight;
      this.contentHeight = this.contentRef.current.scrollHeight;
      if (this.contentHeight !== oldHeight) { return true; }
    }
    return false;
  }

  private updateEdit() {
    if (this.props.editing && !this.props.editingDisabled) {
      if (!this.state.editPlaylist) {
        this.setState({ editPlaylist: deepCopy(this.props.playlist) });
      }
    } else {
      if (this.state.editPlaylist) {
        this.setState({
          editPlaylist: undefined,
          hasChanged: false,
        });
      }
    }
  }

  private onHeadClick() {
    if (this.props.onHeadClick) {
      this.props.onHeadClick(this.props.playlist);
    }
  }

  private onEditClick() {
    if (this.props.onEditClick) {
      this.props.onEditClick(this.props.playlist);
    }
    
  }

  private onDeleteClick() {
    if (this.props.onDeleteClick) {
      this.props.onDeleteClick(this.props.playlist);
    }
  }

  private onSaveClick() {
    if (this.props.onSaveClick) {
      if (!this.state.editPlaylist) { throw new Error('editPlaylist is missing wtf?'); }
      this.props.onSaveClick(this.props.playlist, this.state.editPlaylist);
    }
  }

  private onIconClick() {
    const edit = this.state.editPlaylist;
    if (this.props.editing && edit) {
      // Synchronously show a "open dialog" (this makes the main window "frozen" while this is open)
      const filePaths = window.External.showOpenDialog({
        title: 'Select a new icon for the playlist',
        properties: ['openFile'],
      });
      if (filePaths) {
        toDataURL(filePaths[0])
        .then(dataUrl => {
          edit.icon = dataUrl+'';
          this.setState({ hasChanged: true });
        })
      }
    }
  }

  private onDrop(event: React.DragEvent): void {
    if (this.state.dragOver) {
      this.setState({ dragOver: false });
    }
    if (!this.props.editingDisabled) {
      // Find game
      const gameId: string = event.dataTransfer.getData(gameIdDataType);
      if (gameId) {
        const platform = this.props.central.games.getPlatformOfGameId(gameId);
        if (!platform || !platform.collection) { throw new Error('No game with that ID was found.'); }
        const game = platform.collection.findGame(gameId);
        if (!game) { throw new Error('Game was found but then it wasn\'t found. What?'); }
        // Check if game is already in the playlist
        if (this.props.playlist.games.every(g => g.id !== gameId)) {
          // Add game to playlist(s) (both the edited and unedited, if editing)
          const gameEntry: IGamePlaylistEntry = {
            id: gameId,
            notes: '',
          }
          this.props.playlist.games.push(deepCopy(gameEntry));
          if (this.state.editPlaylist) {
            this.state.editPlaylist.games.push(deepCopy(gameEntry));
          }
          // Save playlist (the un-edited version, even if editing)
          this.props.central.playlists.save(this.props.playlist);
          // Callback
          if (this.props.onDrop) {
            this.props.onDrop(event, this.props.playlist);
          }
        }
      } else {
        console.log('Item dropped on this playlist is not a game id, disregarding it.');
      }
    }
  }

  private onDragOver(event: React.DragEvent): void {
    if (this.props.onDragOver) {
      this.props.onDragOver(event, this.props.playlist);
    }
  }

  private onDragEnter(event: React.DragEvent): void {
    if (!this.state.dragOver) {
      if (!findParent(event.currentTarget, event.relatedTarget as Element)) {
        this.setState({ dragOver: true });
        event.stopPropagation();
      }      
    }
  }

  private onDragLeave(event: React.DragEvent): void {
    if (this.state.dragOver) {
      if (!findParent(event.currentTarget, event.relatedTarget as Element)) {
        this.setState({ dragOver: false });
        event.stopPropagation();
      }      
    }
  }

  private onAddGameDone(text: string) {
    if (!this.state.editPlaylist) { throw new Error('editPlaylist is missing.'); }
    const platform = this.props.central.games.getPlatformOfGameId(text);
    if (!platform || !platform.collection) { throw new Error('No game with that ID was found.'); }
    const game = platform.collection.findGame(text);
    if (!game) { throw new Error('Game was found but then it wasn\'t found. What?'); }
    this.state.editPlaylist.games.push({ 
      id: game.id, 
      notes: ''
    });
    this.setState({ hasChanged: true });
  }

  /** Create a wrapper for a EditableTextWrap's onEditDone callback (this is to reduce redundancy) */
  private wrapOnEditDone(func: (edit: IGamePlaylist, text: string) => void): (text: string) => void {
    return (text: string) => {
      const edit = this.state.editPlaylist;
      if (edit) {
        func(edit, text);
        this.setState({ hasChanged: true });
      }
    }
  }

  onDoubleClickGame(game: IGameInfo, index: number): void {
    const addApps = GameCollection.findAdditionalApplicationsByGameId(this.props.central.games.collection, game.id);
    GameLauncher.launchGame(game, addApps);
  }
  
  /** Update CSS Variables */
  updateCssVars() {
    // Set CCS vars
    const wrapper = this._wrapper.current;
    if (wrapper) {
      wrapper.style.setProperty('--width', this.width+'');
      wrapper.style.setProperty('--height', this.height+'');
    }
  }
}

/** Check if an element or one of its parents is the same as another element */
function findParent(parent: Element, leafElement: Element|null): boolean {
  let element: Element|null = leafElement;
  for (let i = 20; i >= 0; i--) { // (Depth limit - to stop endless looping)
    if (!element) { return false; }
    if (element === parent) { return true; }
    element = element.parentElement;
  }
  return false;
}

function toDataURL(url: string) {
  return fetch(url)
  .then(response => response.blob())
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as any);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  }))
}
