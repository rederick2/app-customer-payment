import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  text: {
    fontSize: 9,
    color: '#444444',
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: 700,
    color: '#333333',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bullet: {
    width: 12,
    fontSize: 9,
  },
  listItemContent: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 4,
  }
});

interface PDFFormattedTextProps {
  text: string;
  style?: any;
  textStyle?: any;
}

export const PDFFormattedText = ({ text, style, textStyle }: PDFFormattedTextProps) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <View style={style}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <View key={index} style={{ height: 4 }} />;

        // Detect markers: •, -, *, 1., 2. (allow optional leading space and optional space after marker)
        const listMarkerMatch = line.match(/^(\s*)([•\-\*]|\d+\.)\s*(.*)/);
        
        // Detect "headers": ends with : OR all caps (and > 3 chars)
        // We exclude lines that are primarily numbers/prices
        const isHeader = trimmedLine.endsWith(':') || 
                        (trimmedLine.length > 4 && trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.match(/^[0-9\$\.\s\-\/]+$/));

        if (listMarkerMatch) {
          const [, indent, marker, content] = listMarkerMatch;
          const indentLevel = indent.length; // Basic indentation detection
          
          return (
            <View key={index} style={[styles.listItem, { paddingLeft: (indentLevel * 8) + 5 }]}>
              <Text style={[styles.bullet, textStyle, isHeader && styles.bold]}>{marker}</Text>
              <Text style={[styles.text, textStyle, styles.listItemContent, isHeader && styles.bold]}>{content}</Text>
            </View>
          );
        }

        return (
          <Text 
            key={index} 
            style={[
              styles.text, 
              textStyle,
              styles.paragraph, 
              isHeader && styles.bold
            ]}
          >
            {line}
          </Text>
        );
      })}
    </View>
  );
};

