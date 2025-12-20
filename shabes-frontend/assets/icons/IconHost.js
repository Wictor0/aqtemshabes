import * as React from "react";
import Svg, { Path } from "react-native-svg";

const IconHost = ({ width = 24, height = 24, color = "#000" }) => (
  <Svg width={width} height={height} viewBox="0 0 151 151" fill="none">
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.2968 67.4065C98.0777 67.4065 116.594 85.9224 116.594 108.703V150H34V108.703C34 85.9224 52.516 67.4065 75.2968 67.4065Z"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M74.5687 57.0042C90.31 57.0042 103.071 44.2433 103.071 28.5021C103.071 12.7608 90.31 0 74.5687 0C58.8275 0 46.0667 12.7608 46.0667 28.5021C46.0667 44.2433 58.8275 57.0042 74.5687 57.0042Z"
      />
    </Svg>
);

export default IconHost;