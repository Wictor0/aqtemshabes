import React from "react";
import { Svg, Path } from "react-native-svg"; // Importe da biblioteca

// Use 'export default' para funcionar com seu 'import ViewIcon from ...'
export default function HideIcon(props) {
  return (
    <Svg
      viewBox="0 0 140 140"
      fill="currentColor" // 👈 Isso permite passar a prop 'color'
      {...props} // 👈 Isso passa width, height, etc.
    >
    <Path d="M128.465 69.2389V71.2389C127.665 73.3389 125.965 75.2389 124.565 77.0389C98.4651 109.239 57.6652 118.639 23.1652 92.7389C17.2652 88.2389 8.16516 79.7389 4.16516 73.5389C2.16516 70.4389 2.96517 68.9389 4.86517 66.2389C9.46517 59.8389 16.7652 52.7389 23.1652 47.9389C57.5652 22.0389 98.4651 31.4389 124.565 63.6389C150.665 95.8389 127.565 67.2389 128.465 69.4389V69.2389ZM65.1652 43.8389C44.8652 44.3389 32.5652 66.7389 43.2652 84.1389C53.0652 100.039 75.8651 100.739 86.9651 85.7389C99.8651 68.1389 86.7652 43.3389 65.1652 43.8389Z" fill="#2950B3"/>
    <Path d="M64.1653 56.0389C81.7653 54.1389 85.9652 79.8389 69.0652 83.9389C49.5652 88.6389 44.4653 58.1389 64.1653 56.0389Z" fill="#2950B3"/>
    </Svg>
  );
}