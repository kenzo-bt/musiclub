import MenuButton from './MenuButton.js';

function Menu(props) {
  return (
    <div className="Menu">
      <div className="menuButtonContainer">
        <MenuButton text="Albums" img={require("../Images/musical-note.png")} clickHandler={() => props.onButtonClick(0)} />
        <MenuButton text="Add" img={require("../Images/more.png")} clickHandler={() => props.onButtonClick(1)} />
        <MenuButton text="Playlist" img={require("../Images/playlist.png")} clickHandler={() => props.onButtonClick(2)} />
      </div>
    </div>
  );
}

export default Menu;
