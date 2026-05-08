import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-emerald-950 items-center justify-center px-8">
          <Text className="text-amber-400 text-6xl mb-6">!</Text>
          <Text className="text-emerald-50 text-xl font-bold mb-3 text-center">Something went wrong</Text>
          <Text className="text-emerald-300 text-sm text-center mb-8 leading-relaxed">
            An unexpected error occurred. Please restart the app.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            className="bg-amber-500 px-8 py-3 rounded-full"
          >
            <Text className="text-emerald-950 font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
