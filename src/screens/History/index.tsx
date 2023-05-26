import { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { View, ScrollView, Alert } from "react-native";
import { HouseLine, Trash } from "phosphor-react-native";
import Animated, {
  Layout,
  SlideInRight,
  SlideOutRight,
} from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";

import { Header } from "../../components/Header";
import { HistoryCard, HistoryProps } from "../../components/HistoryCard";

import { styles } from "./styles";
import { historyGetAll, historyRemove } from "../../storage/quizHistoryStorage";
import { Loading } from "../../components/Loading";
import { THEME } from "../../styles/theme";

export function History() {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryProps[]>([]);

  const { goBack } = useNavigation();

  const swipeableRefs = useRef<Swipeable[]>([]);

  async function fetchHistory() {
    const response = await historyGetAll();
    setHistory(response);
    setIsLoading(false);
  }

  async function remove(id: string) {
    await historyRemove(id);

    fetchHistory();
  }

  function handleRemove(id: string, index: number) {
    swipeableRefs?.current?.[index].close();
    Alert.alert("Remover", "Deseja remover esse registro?", [
      {
        text: "Sim",
        onPress: () => remove(id),
      },
      { text: "Não", style: "cancel" },
    ]);
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="History"
        subtitle={`Your history of completed quizes`}
        icon={HouseLine}
        onPress={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.history}
        showsVerticalScrollIndicator={false}
      >
        {history.map((item, index) => (
          <Animated.View
            key={item.id}
            layout={Layout.springify()}
            entering={SlideInRight}
            exiting={SlideOutRight}
          >
            <Swipeable
              ref={(ref) => {
                if (ref) {
                  swipeableRefs.current.push(ref);
                }
              }}
              overshootLeft={false}
              onSwipeableOpen={() => handleRemove(item.id, index)}
              leftThreshold={10}
              containerStyle={styles.swipeableContainer}
              renderLeftActions={() => (
                <View style={styles.swipeableButton}>
                  <Trash size={32} color={THEME.COLORS.GREY_100} />
                </View>
              )}
              renderRightActions={() => null} // this is to avoid the swipe right on iOS
            >
              <HistoryCard data={item} />
            </Swipeable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
