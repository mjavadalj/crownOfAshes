import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:crown_of_ashes_game/main.dart';

void main() {
  testWidgets('renders an authored decision card', (WidgetTester tester) async {
    final content = ContentBundle.fromJson({
      'schemaVersion': 1,
      'contentVersion': 'test',
      'phases': [
        {'id': 'rebellion', 'name': 'Rebellion', 'order': 0},
      ],
      'stats': [
        {
          'id': 'popularity',
          'name': 'Popularity',
          'value': 62,
          'min': 0,
          'max': 100,
        },
        {
          'id': 'legitimacy',
          'name': 'Legitimacy',
          'value': 44,
          'min': 0,
          'max': 100,
        },
        {
          'id': 'military',
          'name': 'Military',
          'value': 58,
          'min': 0,
          'max': 100,
        },
        {'id': 'money', 'name': 'Money', 'value': 35, 'min': 0, 'max': 100},
      ],
      'events': [],
      'cards': [
        {
          'id': 'card_test',
          'title': 'A Test Decision',
          'artwork': '',
          'situation': 'A door opens in the rain.',
          'phase': 'rebellion',
          'dayFrom': 1,
          'choices': [
            {'id': 'a', 'text': 'Enter', 'conditions': [], 'effects': []},
            {'id': 'b', 'text': 'Wait', 'conditions': [], 'effects': []},
          ],
        },
      ],
    });

    await tester.pumpWidget(
      MaterialApp(
        home: GameHome(
          content: content,
          initialState: GameState.fromContent(content),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('A TEST DECISION'), findsOneWidget);
    expect(find.text('A door opens in the rain.'), findsOneWidget);
    expect(find.text('Enter'), findsOneWidget);
    expect(find.text('Wait'), findsOneWidget);
  });

  test('persists the run state between loads', () async {
    SharedPreferences.setMockInitialValues({});
    final content = ContentBundle.fromJson({
      'schemaVersion': 1,
      'contentVersion': 'test',
      'phases': [
        {'id': 'rebellion', 'name': 'Rebellion', 'order': 0},
      ],
      'stats': [
        {
          'id': 'popularity',
          'name': 'Popularity',
          'value': 62,
          'min': 0,
          'max': 100,
        },
      ],
      'events': [],
      'cards': [],
    });

    final state =
        GameState.fromContent(content)
          ..day = 7
          ..phase = 'revolution'
          ..stats['popularity'] = 24
          ..flags.add('letters_read');
    await state.persist();

    final restored = await GameState.load(content);
    expect(restored.day, 7);
    expect(restored.phase, 'revolution');
    expect(restored.stats['popularity'], 24);
    expect(restored.flags, contains('letters_read'));
  });
}
