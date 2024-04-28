function MenuButton(props) {
  return (
    <button className="MenuButton" onClick={props.clickHandler}>
      <img src={props.img} alt={props.text + " icon"} />
    </button>
  );
}

export default MenuButton;
