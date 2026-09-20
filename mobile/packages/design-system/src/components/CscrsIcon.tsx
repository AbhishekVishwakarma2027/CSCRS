import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle, Text } from 'react-native';

export type CscrsIconName =
  | 'home'
  | 'reports'
  | 'tasks'
  | 'notifications'
  | 'profile'
  | 'refresh'
  | 'location'
  | 'camera'
  | 'gallery'
  | 'map'
  | 'edit'
  | 'delete'
  | 'add'
  | 'settings'
  | 'theme'
  | 'feedback'
  | 'help'
  | 'logout'
  | 'search'
  | 'check'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'lock'
  | 'key'
  | 'alert'
  | 'issue'
  | 'star'
  | 'bell'
  | 'user'
  | 'file-text'
  | 'check-square'
  | 'map-pin'
  | 'clock'
  | 'eye'
  | 'eye-off'
  | 'arrow-left'
  | 'check-circle'
  | 'alert-circle'
  | 'chevron-right'
  | 'chevron-left'
  | 'log-out'
  | 'edit-2'
  | 'trash-2'
  | 'x'
  | 'image'
  | 'maximize-2'
  | 'circle'
  | 'phone'
  | 'refresh-cw';

export interface CscrsIconProps {
  name: CscrsIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Coherent, professional vector iconography for CSCRS Mobile.
 * Uses clean geometric shapes and vector primitives with consistent 1.8px stroke weight.
 * Completely replaces childish emojis without introducing heavy or fragile font dependencies.
 */
export const CscrsIcon: React.FC<CscrsIconProps> = ({
  name,
  size = 20,
  color = '#0F2942',
  style,
}) => {
  const stroke = Math.max(1.6, Math.round(size * 0.09));

  const renderIcon = () => {
    switch (name) {
      case 'home':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Roof */}
            <View
              style={{
                width: size * 0.72,
                height: size * 0.72,
                borderTopWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
                top: size * 0.08,
              }}
            />
            {/* Body */}
            <View
              style={{
                width: size * 0.56,
                height: size * 0.44,
                borderWidth: stroke,
                borderTopWidth: 0,
                borderColor: color,
                position: 'absolute',
                bottom: size * 0.12,
                alignItems: 'center',
              }}
            >
              {/* Door */}
              <View
                style={{
                  width: size * 0.2,
                  height: size * 0.24,
                  backgroundColor: color,
                  position: 'absolute',
                  bottom: 0,
                }}
              />
            </View>
          </View>
        );

      case 'reports':
      case 'tasks':
        return (
          <View
            style={[
              styles.center,
              {
                width: size * 0.65,
                height: size * 0.85,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: Math.max(2, size * 0.1),
                paddingTop: size * 0.18,
                paddingHorizontal: size * 0.08,
              },
            ]}
          >
            {/* Clipboard clip */}
            <View
              style={{
                position: 'absolute',
                top: -stroke,
                width: size * 0.32,
                height: stroke * 2,
                backgroundColor: color,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
            {/* Content lines */}
            <View style={{ width: '100%', height: stroke, backgroundColor: color, marginBottom: size * 0.1 }} />
            <View style={{ width: '80%', height: stroke, backgroundColor: color, marginBottom: size * 0.1 }} />
            <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          </View>
        );

      case 'notifications':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Bell dome */}
            <View
              style={{
                width: size * 0.6,
                height: size * 0.58,
                borderWidth: stroke,
                borderBottomWidth: 0,
                borderColor: color,
                borderTopLeftRadius: size * 0.3,
                borderTopRightRadius: size * 0.3,
                top: size * 0.08,
              }}
            />
            {/* Bell rim */}
            <View
              style={{
                width: size * 0.8,
                height: stroke,
                backgroundColor: color,
                top: size * 0.08,
              }}
            />
            {/* Clapper dot */}
            <View
              style={{
                width: size * 0.22,
                height: size * 0.14,
                borderWidth: stroke,
                borderTopWidth: 0,
                borderColor: color,
                borderBottomLeftRadius: size * 0.1,
                borderBottomRightRadius: size * 0.1,
                top: size * 0.08,
              }}
            />
          </View>
        );

      case 'profile':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Head */}
            <View
              style={{
                width: size * 0.38,
                height: size * 0.38,
                borderRadius: size * 0.19,
                borderWidth: stroke,
                borderColor: color,
                position: 'absolute',
                top: size * 0.1,
              }}
            />
            {/* Shoulders */}
            <View
              style={{
                width: size * 0.72,
                height: size * 0.36,
                borderTopLeftRadius: size * 0.36,
                borderTopRightRadius: size * 0.36,
                borderWidth: stroke,
                borderBottomWidth: 0,
                borderColor: color,
                position: 'absolute',
                bottom: size * 0.08,
              }}
            />
          </View>
        );

      case 'location':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Pin teardrop */}
            <View
              style={{
                width: size * 0.58,
                height: size * 0.58,
                borderRadius: size * 0.29,
                borderWidth: stroke,
                borderColor: color,
                borderBottomRightRadius: 0,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
                top: size * 0.08,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Inner pin dot */}
              <View
                style={{
                  width: size * 0.18,
                  height: size * 0.18,
                  borderRadius: size * 0.09,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'camera':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Top bump */}
            <View
              style={{
                width: size * 0.3,
                height: stroke * 1.5,
                backgroundColor: color,
                position: 'absolute',
                top: size * 0.14,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
            {/* Camera body */}
            <View
              style={{
                width: size * 0.8,
                height: size * 0.56,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: Math.max(3, size * 0.12),
                position: 'absolute',
                bottom: size * 0.14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Lens */}
              <View
                style={{
                  width: size * 0.28,
                  height: size * 0.28,
                  borderRadius: size * 0.14,
                  borderWidth: stroke,
                  borderColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'gallery':
        return (
          <View
            style={[
              styles.center,
              {
                width: size * 0.8,
                height: size * 0.68,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: Math.max(3, size * 0.12),
                overflow: 'hidden',
              },
            ]}
          >
            {/* Sun / moon in image */}
            <View
              style={{
                width: size * 0.18,
                height: size * 0.18,
                borderRadius: size * 0.09,
                backgroundColor: color,
                position: 'absolute',
                top: size * 0.1,
                left: size * 0.12,
              }}
            />
            {/* Mountain peak */}
            <View
              style={{
                width: size * 0.6,
                height: size * 0.6,
                borderTopWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
                bottom: -size * 0.32,
                right: -size * 0.08,
              }}
            />
          </View>
        );

      case 'refresh':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.7,
                height: size * 0.7,
                borderRadius: size * 0.35,
                borderWidth: stroke,
                borderTopColor: 'transparent',
                borderRightColor: color,
                borderBottomColor: color,
                borderLeftColor: color,
              }}
            />
            {/* Arrowhead */}
            <View
              style={{
                width: stroke * 2.2,
                height: stroke * 2.2,
                borderTopWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                position: 'absolute',
                top: size * 0.1,
                right: size * 0.2,
                transform: [{ rotate: '-30deg' }],
              }}
            />
          </View>
        );

      case 'search':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Glass circle */}
            <View
              style={{
                width: size * 0.54,
                height: size * 0.54,
                borderRadius: size * 0.27,
                borderWidth: stroke,
                borderColor: color,
                position: 'absolute',
                top: size * 0.12,
                left: size * 0.12,
              }}
            />
            {/* Handle */}
            <View
              style={{
                width: stroke,
                height: size * 0.38,
                backgroundColor: color,
                position: 'absolute',
                bottom: size * 0.12,
                right: size * 0.18,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        );

      case 'check':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.55,
                height: size * 0.32,
                borderLeftWidth: stroke * 1.2,
                borderBottomWidth: stroke * 1.2,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                top: -size * 0.05,
              }}
            />
          </View>
        );

      case 'close':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.7,
                height: stroke * 1.2,
                backgroundColor: color,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
              }}
            />
            <View
              style={{
                width: size * 0.7,
                height: stroke * 1.2,
                backgroundColor: color,
                transform: [{ rotate: '-45deg' }],
                position: 'absolute',
              }}
            />
          </View>
        );

      case 'add':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.65,
                height: stroke * 1.2,
                backgroundColor: color,
                position: 'absolute',
              }}
            />
            <View
              style={{
                width: stroke * 1.2,
                height: size * 0.65,
                backgroundColor: color,
                position: 'absolute',
              }}
            />
          </View>
        );

      case 'chevronRight':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.35,
                height: size * 0.35,
                borderTopWidth: stroke * 1.2,
                borderRightWidth: stroke * 1.2,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                left: -size * 0.08,
              }}
            />
          </View>
        );

      case 'chevronLeft':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.35,
                height: size * 0.35,
                borderTopWidth: stroke * 1.2,
                borderLeftWidth: stroke * 1.2,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                left: size * 0.08,
              }}
            />
          </View>
        );

      case 'lock':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Shackle */}
            <View
              style={{
                width: size * 0.44,
                height: size * 0.4,
                borderWidth: stroke,
                borderBottomWidth: 0,
                borderColor: color,
                borderTopLeftRadius: size * 0.22,
                borderTopRightRadius: size * 0.22,
                position: 'absolute',
                top: size * 0.1,
              }}
            />
            {/* Body */}
            <View
              style={{
                width: size * 0.65,
                height: size * 0.45,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: 3,
                position: 'absolute',
                bottom: size * 0.1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: stroke * 1.2, height: size * 0.15, backgroundColor: color }} />
            </View>
          </View>
        );

      case 'star':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text
              style={{
                fontSize: size * 0.9,
                color,
                lineHeight: size,
                textAlign: 'center',
              }}
            >
              ★
            </Text>
          </View>
        );

      case 'theme':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.65,
                height: size * 0.65,
                borderRadius: size * 0.325,
                borderWidth: stroke,
                borderColor: color,
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        );

      case 'feedback':
      case 'issue':
        return (
          <View
            style={[
              styles.center,
              {
                width: size * 0.75,
                height: size * 0.6,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: Math.max(3, size * 0.12),
              },
            ]}
          >
            <View style={{ width: '60%', height: stroke, backgroundColor: color, marginBottom: size * 0.08 }} />
            <View style={{ width: '40%', height: stroke, backgroundColor: color }} />
            {/* Speech pointer */}
            <View
              style={{
                width: stroke * 2,
                height: stroke * 2,
                backgroundColor: color,
                position: 'absolute',
                bottom: -stroke * 1.5,
                left: size * 0.15,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );

      case 'edit':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.22,
                height: size * 0.65,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: 2,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );

      case 'delete':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Lid */}
            <View style={{ width: size * 0.65, height: stroke, backgroundColor: color, marginBottom: stroke }} />
            {/* Can */}
            <View
              style={{
                width: size * 0.5,
                height: size * 0.55,
                borderWidth: stroke,
                borderColor: color,
                borderTopWidth: 0,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                paddingTop: stroke,
              }}
            >
              <View style={{ width: stroke * 0.7, height: '70%', backgroundColor: color }} />
              <View style={{ width: stroke * 0.7, height: '70%', backgroundColor: color }} />
            </View>
          </View>
        );

      case 'logout':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Door box */}
            <View
              style={{
                width: size * 0.6,
                height: size * 0.75,
                borderWidth: stroke,
                borderRightWidth: 0,
                borderColor: color,
                position: 'absolute',
                left: size * 0.05,
              }}
            />
            {/* Arrow right */}
            <View
              style={{
                width: size * 0.45,
                height: stroke * 1.2,
                backgroundColor: color,
                position: 'absolute',
                right: size * 0.08,
              }}
            />
            <View
              style={{
                width: size * 0.22,
                height: size * 0.22,
                borderTopWidth: stroke * 1.2,
                borderRightWidth: stroke * 1.2,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
                right: size * 0.08,
              }}
            />
          </View>
        );

      case 'map':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.75,
                height: size * 0.65,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: 2,
                flexDirection: 'row',
                justifyContent: 'space-evenly',
              }}
            >
              <View style={{ width: stroke, height: '100%', backgroundColor: color }} />
              <View style={{ width: stroke, height: '100%', backgroundColor: color }} />
            </View>
          </View>
        );

      case 'bell':
        return <CscrsIcon name="notifications" size={size} color={color} />;

      case 'user':
        return <CscrsIcon name="profile" size={size} color={color} />;

      case 'file-text':
        return <CscrsIcon name="reports" size={size} color={color} />;

      case 'check-square':
        return <CscrsIcon name="tasks" size={size} color={color} />;

      case 'map-pin':
        return <CscrsIcon name="location" size={size} color={color} />;

      case 'refresh-cw':
        return <CscrsIcon name="refresh" size={size} color={color} />;

      case 'chevron-right':
        return <CscrsIcon name="chevronRight" size={size} color={color} />;

      case 'chevron-left':
        return <CscrsIcon name="chevronLeft" size={size} color={color} />;

      case 'log-out':
        return <CscrsIcon name="logout" size={size} color={color} />;

      case 'edit-2':
        return <CscrsIcon name="edit" size={size} color={color} />;

      case 'trash-2':
        return <CscrsIcon name="delete" size={size} color={color} />;

      case 'x':
        return <CscrsIcon name="close" size={size} color={color} />;

      case 'image':
        return <CscrsIcon name="gallery" size={size} color={color} />;

      case 'check-circle':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.85,
                height: size * 0.85,
                borderRadius: size * 0.425,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: size * 0.38,
                  height: size * 0.22,
                  borderBottomWidth: stroke,
                  borderLeftWidth: stroke,
                  borderColor: color,
                  transform: [{ rotate: '-45deg' }, { translateY: -size * 0.04 }],
                }}
              />
            </View>
          </View>
        );

      case 'alert-circle':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.85,
                height: size * 0.85,
                borderRadius: size * 0.425,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: stroke * 1.1, height: size * 0.26, backgroundColor: color, marginBottom: 2 }} />
              <View style={{ width: stroke * 1.1, height: stroke * 1.1, backgroundColor: color, borderRadius: stroke * 0.55 }} />
            </View>
          </View>
        );

      case 'arrow-left':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View style={{ width: size * 0.5, height: stroke, backgroundColor: color, position: 'absolute' }} />
            <View
              style={{
                width: size * 0.28,
                height: size * 0.28,
                borderTopWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                position: 'absolute',
                left: size * 0.22,
              }}
            />
          </View>
        );

      case 'clock':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.85,
                height: size * 0.85,
                borderRadius: size * 0.425,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: stroke, height: size * 0.25, backgroundColor: color, position: 'absolute', top: size * 0.16 }} />
              <View style={{ width: size * 0.22, height: stroke, backgroundColor: color, position: 'absolute', right: size * 0.2 }} />
            </View>
          </View>
        );

      case 'eye':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.85,
                height: size * 0.48,
                borderRadius: size * 0.24,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12, backgroundColor: color }} />
            </View>
          </View>
        );

      case 'eye-off':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.85,
                height: size * 0.48,
                borderRadius: size * 0.24,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12, backgroundColor: color }} />
            </View>
            <View style={{ width: size * 0.85, height: stroke, backgroundColor: color, position: 'absolute', transform: [{ rotate: '-45deg' }] }} />
          </View>
        );

      case 'circle':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375, borderWidth: stroke, borderColor: color }} />
          </View>
        );

      case 'phone':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.44,
                height: size * 0.75,
                borderRadius: 4,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 3,
              }}
            >
              <View style={{ width: size * 0.15, height: 2, backgroundColor: color }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
            </View>
          </View>
        );

      case 'maximize-2':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View style={{ width: size * 0.75, height: size * 0.75, borderWidth: stroke, borderColor: color, borderRadius: 2 }} />
          </View>
        );

      case 'key':
      case 'settings':
      case 'help':
      case 'alert':
      default:
        return (
          <View
            style={[
              styles.center,
              {
                width: size * 0.75,
                height: size * 0.75,
                borderRadius: size * 0.375,
                borderWidth: stroke,
                borderColor: color,
              },
            ]}
          >
            <View style={{ width: stroke * 1.2, height: size * 0.3, backgroundColor: color }} />
          </View>
        );
    }
  };

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
