import MenuButton from './MenuButton.js';

function Menu(props) {
  return (
    <div className="Menu">
      <div className="menuButtonContainer">
        <MenuButton text="Albums" img="musical-note.png" clickHandler={() => props.onButtonClick(0)} />
        <MenuButton text="Add" img="more.png" clickHandler={() => props.onButtonClick(1)} />
        <MenuButton text="Playlist" img="playlist.png" clickHandler={() => props.onButtonClick(2)} />
      </div>
    </div>
  );
}

export default Menu;
