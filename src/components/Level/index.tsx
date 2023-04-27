import { useEffect } from "react";
import { Pressable, PressableProps, Text } from "react-native";

import { THEME } from "../../styles/theme";
import { styles } from "./styles";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  withTiming,
} from "react-native-reanimated";

// useSharedValue: they are used inside useAnimatedStyle. If they change, the useAnimatedStyle will react to this
// useAnimatedStyle: is reactive to useSharedValue
// withSpring and withTiming defines the types of animations, they have a durantion prop and we can import the Easing from reanimated to redefine the kind of animation

/* 
  COLOR INTERPOLATE
  Using interpolateColor we could change the component color
  with some animation and make it more fluid.
*/

/* 
  CREATE ANIMATED COMPONENT
  By the default, for example, the Pressable component doesn't have a Animated.Pressable
  so, we can use Animated.createAnimatedComponent(Pressable) to create a Pressable 
  which will accept animations.
*/

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

const TYPE_COLORS = {
  EASY: THEME.COLORS.BRAND_LIGHT,
  HARD: THEME.COLORS.DANGER_LIGHT,
  MEDIUM: THEME.COLORS.WARNING_LIGHT,
};

type Props = PressableProps & {
  title: string;
  isChecked?: boolean;
  type?: keyof typeof TYPE_COLORS;
};

export function Level({
  title,
  type = "EASY",
  isChecked = false,
  ...rest
}: Props) {
  const scale = useSharedValue(1.0);
  // can be Boolean?
  const checked = useSharedValue(1);

  const COLOR = TYPE_COLORS[type];

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        checked.value,
        [0, 1],
        ["transparent", COLOR]
      ),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        checked.value,
        [0, 1],
        [COLOR, THEME.COLORS.GREY_100]
      ),
    };
  });

  const onPressIn = () => {
    scale.value = withSpring(1.1);
  };

  const onPressOut = () => {
    scale.value = withSpring(1.0);
  };

  useEffect(() => {
    checked.value = withTiming(isChecked ? 1 : 0, { duration: 300 });
  }, [isChecked]);

  return (
    <PressableAnimated
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...rest}
      style={[
        styles.container,
        animatedContainerStyle,
        {
          borderColor: COLOR,
        },
      ]}
    >
      <Animated.Text style={[styles.title, animatedTextStyle]}>
        {title}
      </Animated.Text>
    </PressableAnimated>
  );
}
