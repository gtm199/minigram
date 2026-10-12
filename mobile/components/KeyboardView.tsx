import { ReactNode, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, StyleProp, View, ViewStyle } from "react-native";

export function KeyboardView({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const containerRef = useRef<View>(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      // How far the bottom of this view extends below the top of the keyboard.
      containerRef.current?.measureInWindow((_x, y, _width, height) => {
        const overlap = y + height - event.endCoordinates.screenY;
        setLift(Math.max(0, overlap));
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setLift(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View ref={containerRef} style={[{ flex: 1, paddingBottom: lift }, style]}>
      {children}
    </View>
  );
}