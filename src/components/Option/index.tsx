import React, { useEffect } from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import {
  Canvas,
  Skia,
  Path,
  useValue,
  runTiming,
  BlurMask,
  Circle,
  Easing,
} from "@shopify/react-native-skia";

import { styles } from "./styles";
import { THEME } from "../../styles/theme";

type Props = TouchableOpacityProps & {
  checked: boolean;
  title: string;
};

const CHECK_SIZE = 28;
const CHECK_STROKE = 2;
const RADIUS = (CHECK_SIZE - CHECK_STROKE) / 2;
const CENTER_CIRCLE = RADIUS / 2;

export function Option({ checked, title, ...rest }: Props) {
  const path = Skia.Path.Make();
  path.addCircle(CHECK_SIZE, CHECK_SIZE, RADIUS);

  const percentage = useValue(0);
  const circle = useValue(0);

  useEffect(() => {
    if (checked) {
      runTiming(percentage, 1, { duration: 700 });
      runTiming(circle, CENTER_CIRCLE, { easing: Easing.bounce });
    } else {
      runTiming(percentage, 0, { duration: 700 });
      runTiming(circle, 0, { duration: 300 });
    }
  }, [checked]);

  return (
    <TouchableOpacity
      style={[styles.container, checked && styles.checked]}
      {...rest}
    >
      <Text style={styles.title}>{title}</Text>

      <Canvas style={{ height: CHECK_SIZE * 2, width: CHECK_SIZE * 2 }}>
        <Path
          path={path}
          color={THEME.COLORS.GREY_500}
          style="stroke"
          strokeWidth={CHECK_STROKE}
        />
        <Path
          path={path}
          color={THEME.COLORS.BRAND_LIGHT}
          style="stroke"
          strokeWidth={CHECK_STROKE}
          start={0}
          end={percentage}
        >
          <BlurMask blur={0.7} />
        </Path>

        <Circle
          cx={CHECK_SIZE}
          cy={CHECK_SIZE}
          r={circle}
          color={THEME.COLORS.BRAND_LIGHT}
        >
          <BlurMask blur={2} />
        </Circle>
      </Canvas>
    </TouchableOpacity>
  );
}
