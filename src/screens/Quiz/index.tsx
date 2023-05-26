import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { useNavigation, useRoute } from "@react-navigation/native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  useAnimatedScrollHandler,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";

import { styles } from "./styles";

import { QUIZ } from "../../data/quiz";
import { historyAdd } from "../../storage/quizHistoryStorage";

import { Loading } from "../../components/Loading";
import { Question } from "../../components/Question";
import { QuizHeader } from "../../components/QuizHeader";
import { ConfirmButton } from "../../components/ConfirmButton";
import { OutlineButton } from "../../components/OutlineButton";
import { ProgressBar } from "../../components/ProgressBar";
import { OverlayFeedback } from "../../components/OverlayFeedback";
import { THEME } from "../../styles/theme";

interface Params {
  id: string;
}

type QuizProps = (typeof QUIZ)[0];

const QUESTION_CARD_INCLINATION = 10;
const QUESTION_SKIP_AREA = -200;

export function Quiz() {
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quiz, setQuiz] = useState<QuizProps>({} as QuizProps);
  const [alternativeSelected, setAlternativeSelected] = useState<null | number>(
    null
  );

  const [statusReply, setStatusReply] = useState(0);

  const shake = useSharedValue(0);
  const scrollScreenY = useSharedValue(0);
  const cardPosition = useSharedValue(0);

  const shakeAnimation = () => {
    shake.value = withSequence(
      withTiming(3, { duration: 400, easing: Easing.bounce }),
      withTiming(0, undefined, (finished) => {
        "worklet";
        if (finished) {
          runOnJS(handleNextQuestion)();
        }
      })
    );
  };

  const shakeStyleAnimated = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shake.value,
            [0, 0.5, 1, 1.5, 2, 2.5, 3],
            [0, -15, 0, 15, 0, -15, 0]
          ),
        },
      ],
    };
  });

  const { navigate } = useNavigation();

  const route = useRoute();
  const { id } = route.params as Params;

  function handleSkipConfirm() {
    Alert.alert("Pular", "Deseja realmente pular a questão?", [
      { text: "Sim", onPress: () => {} },
      { text: "Não", onPress: () => {} },
    ]);
  }

  async function handleFinished() {
    await historyAdd({
      id: new Date().getTime().toString(),
      title: quiz.title,
      level: quiz.level,
      points,
      questions: quiz.questions.length,
    });

    navigate("finish", {
      points: String(points),
      total: String(quiz.questions.length),
    });
  }

  function handleNextQuestion() {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prevState) => prevState + 1);
    } else {
      handleFinished();
    }
  }

  async function handleConfirm() {
    if (alternativeSelected === null) {
      return handleSkipConfirm();
    }

    if (quiz.questions[currentQuestion].correct === alternativeSelected) {
      setStatusReply(1);
      setPoints((prevState) => prevState + 1);
      setAlternativeSelected(null);
      handleNextQuestion();
    } else {
      setStatusReply(2);
      shakeAnimation();
    }
  }

  function handleStop() {
    Alert.alert("Parar", "Deseja parar agora?", [
      {
        text: "Não",
        style: "cancel",
      },
      {
        text: "Sim",
        style: "destructive",
        onPress: () => navigate("home"),
      },
    ]);

    return true;
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollScreenY.value = event.contentOffset.y;
    },
  });

  const fixedProgressBarStyles = useAnimatedStyle(() => {
    return {
      position: "absolute",
      zIndex: 1,
      paddingTop: 70,
      backgroundColor: THEME.COLORS.GREY_500,
      width: "110%",
      left: "-5%",
      opacity: interpolate(
        scrollScreenY.value,
        [50, 90],
        [0, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollScreenY.value,
            [50, 100],
            [-40, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const headerStyles = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollScreenY.value,
        [40, 130],
        [1, 0],
        Extrapolate.CLAMP
      ),
    };
  });

  const onLongPress = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      console.log("Long press just to show how Gesture.Simultaneous work");
    });

  const handlePanGesture = Gesture.Pan()
    .activateAfterLongPress(100)
    .onUpdate((event) => {
      const isMovingLeft = event.translationX < 0;
      if (isMovingLeft) cardPosition.value = event.translationX;
    })
    .onEnd((event) => {
      cardPosition.value = withTiming(0);
      if (event.translationX < QUESTION_SKIP_AREA) {
        runOnJS(handleSkipConfirm)();
      }
    });

  const dragStyles = useAnimatedStyle(() => {
    const rotateZ = cardPosition.value / QUESTION_CARD_INCLINATION;
    return {
      transform: [
        { translateX: cardPosition.value },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  const onUnmount = () => setStatusReply(0);

  useEffect(() => {
    const quizSelected = QUIZ.filter((item) => item.id === id)[0];
    setQuiz(quizSelected);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <OverlayFeedback status={statusReply} />
      <Animated.View style={fixedProgressBarStyles}>
        <Text style={styles.headerTitle}>{quiz.title}</Text>

        <ProgressBar
          total={quiz.questions.length}
          current={currentQuestion + 1}
        />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.question}
        onScroll={scrollHandler}
        scrollEventThrottle={16} // this will make the scroll more fluid on iOS
      >
        <Animated.View style={[styles.header, headerStyles]}>
          <QuizHeader
            title={quiz.title}
            currentQuestion={currentQuestion + 1}
            totalOfQuestions={quiz.questions.length}
          />
        </Animated.View>

        <GestureDetector
          gesture={Gesture.Simultaneous(handlePanGesture, onLongPress)}
        >
          <Animated.View style={[shakeStyleAnimated, dragStyles]}>
            <Question
              key={quiz.questions[currentQuestion].title}
              question={quiz.questions[currentQuestion]}
              alternativeSelected={alternativeSelected}
              setAlternativeSelected={setAlternativeSelected}
              onUnmount={onUnmount}
            />
          </Animated.View>
        </GestureDetector>
        <View style={styles.footer}>
          <OutlineButton title="Parar" onPress={handleStop} />
          <ConfirmButton onPress={handleConfirm} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
