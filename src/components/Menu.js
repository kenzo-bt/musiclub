import MenuButton from './MenuButton.js';

function Menu(props) {
  return (
    <div className="Menu">
      <div className="menuButtonContainer">
        <MenuButton text="Albums" img={require("../images/musical-note.png")} clickHandler={() => props.onButtonClick(0)} />
        <MenuButton text="Add" img={require("../images/more.png")} clickHandler={() => props.onButtonClick(1)} />
        <MenuButton text="Playlist" img={require("../images/playlist.png")} clickHandler={() => props.onButtonClick(2)} />
      </div>
    </div>
  );
}

export default Menu;
