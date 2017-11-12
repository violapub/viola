import React from 'react';
import {Icon} from 'react-fa';
import classnames from 'classnames';
import './Button.css';

const IconButton = ({
  className, name, black, opaque,
  ...other
}) => {
  const buttonClasses = classnames(className, 'IconButton_button', {
    black: black,
    opaque: opaque,
  });

  return (
    <button {...other} className={buttonClasses}>
      <Icon name={name} />
    </button>
  );
};

class SelectiveRippleButton extends React.Component {

  props: {
    data: Array<{
      name: string,
      onClick: ?() => void,
    }>,
    initialActiveIndex: ?number,
    onChange: ?(number) => void,
  };

  constructor(props) {
    super(props);
    this.state = {
      active: props.initialActiveIndex || 0,
    }
  }

  onItemClick = (idx) => () => {
    const { data, onChange } = this.props;

    this.setState({
      active: idx,
    });
    if (data[idx].onClick) {
      data[idx].onClick();
    }
    if (onChange) {
      onChange(idx);
    }
  };

  render() {
    const { className, data, initialActive, onChange, ...other } = this.props;
    const { active } = this.state;

    return (
      <div {...other} className={classnames(className, 'SelectiveRippleButton')}>
        <span className="SelectiveRippleButton_paper"
          style={{ transform: `translateX(${active*38}px)` }}
        />
        {data.map((d, idx) =>
          <div key={idx} className={classnames('SelectiveRippleButton_item', { active: idx === active})}
            onClick={this.onItemClick(idx)}
          >
            <Icon name={d.name} />
          </div>
        )}
      </div>
    );
  }
}

export {
  IconButton,
  SelectiveRippleButton,
};
