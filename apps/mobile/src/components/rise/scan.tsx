import { spotMatches } from '@murshid/core';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import { Flashlight } from 'phosphor-react-native/src/icons/Flashlight';
import { useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';

/** Every common kind of code, so whatever is in the bathroom works. */
const CODES: BarcodeType[] = [
  'qr',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'datamatrix',
  'pdf417',
  'aztec',
];
const SAME_CODE_MS = 1500;

/**
 * The camera reads a code, nothing more: no picture is taken or kept (SPEC 5.10). With `saved`
 * it checks the code against the one chosen in setup; without, it hands back what it read.
 */
export function Scanner({
  saved,
  onCode,
  onActivity,
  hint,
}: {
  saved?: string | null;
  onCode: (code: string) => void;
  onActivity?: () => void;
  hint: string;
}) {
  const t = useTranslations('rise');
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [wrong, setWrong] = useState(false);
  const last = useRef<{ code: string; at: number } | null>(null);
  const finished = useRef(false);

  if (!permission) return <View className="flex-1" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4">
        <Text role="body" className="text-center">
          {t('spot.camera')}
        </Text>
        <Button
          onPress={() =>
            permission.canAskAgain ? void requestPermission() : void Linking.openSettings()
          }
        >
          {permission.canAskAgain ? t('spot.allowCamera') : t('spot.openSettings')}
        </Button>
      </View>
    );
  }

  const scanned = (code: string) => {
    if (finished.current) return;
    const now = Date.now();
    if (last.current?.code === code && now - last.current.at < SAME_CODE_MS) return;
    last.current = { code, at: now };
    onActivity?.();
    if (saved === undefined || spotMatches(saved, code)) {
      finished.current = true;
      setWrong(false);
      haptics.success();
      onCode(code.trim());
      return;
    }
    haptics.medium();
    setWrong(true);
  };

  return (
    <View className="flex-1 gap-3">
      <Text role="headline" className="text-center">
        {hint}
      </Text>
      <View className="flex-1 overflow-hidden rounded-card border border-hairline">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: CODES }}
          onBarcodeScanned={({ data }) => scanned(data)}
        />
        <View
          pointerEvents="none"
          className="absolute inset-12 rounded-control border-2 border-lantern"
        />
        <View className="absolute bottom-3 end-3">
          <IconButton
            icon={Flashlight}
            label={t('spot.torch')}
            variant="tinted"
            selected={torch}
            onPress={() => setTorch(!torch)}
          />
        </View>
      </View>
      <Text
        role="callout"
        tone={wrong ? 'lantern' : 'muted'}
        className="text-center"
        accessibilityLiveRegion="polite"
      >
        {wrong ? t('scan.wrong') : t('spot.scanHint')}
      </Text>
    </View>
  );
}
