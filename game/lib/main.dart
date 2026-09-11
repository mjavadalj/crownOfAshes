import 'dart:convert';
import 'reliquary_frame.dart';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _ink = Color(0xFF080708);
const _coal = Color(0xFF100D0E);
const _panel = Color(0xFF151011);
const _parchment = Color(0xFFE1C39C);
const _mutedParchment = Color(0xFFBCA58A);
const _brass = Color(0xFFAB8456);
const _oxblood = Color(0xFF8F3039);


Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final content = await ContentRepository.load();
  final savedState = await GameState.load(content);
  runApp(CrownOfAshesApp(content: content, initialState: savedState));
}

class CrownOfAshesApp extends StatelessWidget {
  const CrownOfAshesApp({
    required this.content,
    required this.initialState,
    super.key,
  });

  final ContentBundle content;
  final GameState initialState;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Crown of Ashes',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: _ink,
        colorScheme: const ColorScheme.dark(primary: _brass, surface: _coal),
        fontFamily: 'EBGaramond',
        textTheme: const TextTheme(bodyMedium: TextStyle(color: _parchment)),
      ),
      home: GameHome(content: content, initialState: initialState),
    );
  }
}

class GameHome extends StatefulWidget {
  const GameHome({
    required this.content,
    required this.initialState,
    super.key,
  });

  final ContentBundle content;
  final GameState initialState;

  @override
  State<GameHome> createState() => _GameHomeState();
}

class _GameHomeState extends State<GameHome> {
  late GameState _state;
  int _cardIndex = 0;
  double _dragX = 0;
  bool _isChoosing = false;
  String? _lastChoice;

  @override
  void initState() {
    super.initState();
    _state = widget.initialState;
    _cardIndex = _findFirstAvailableIndex();
  }

  int _findFirstAvailableIndex() {
    final index = widget.content.cards.indexWhere(
      (card) => card.isAvailable(_state),
    );
    return index == -1 ? 0 : index;
  }

  GameCard get _currentCard {
    if (widget.content.cards.isEmpty) return GameCard.empty();
    if (_cardIndex >= widget.content.cards.length)
      return widget.content.cards.first;
    return widget.content.cards[_cardIndex];
  }

  void _onDragUpdate(DragUpdateDetails details) {
    if (_isChoosing) return;
    setState(() => _dragX = (_dragX + details.delta.dx).clamp(-160, 160));
  }

  Future<void> _onDragEnd(DragEndDetails details) async {
    if (_isChoosing || _dragX.abs() < 90) {
      setState(() => _dragX = 0);
      return;
    }
    await _choose(_dragX < 0 ? 0 : 1);
  }

  Future<void> _choose(int choiceIndex) async {
    if (_isChoosing) return;
    final card = _currentCard;
    if (card.choices.length <= choiceIndex ||
        !card.choices[choiceIndex].isAvailable(_state))
      return;
    setState(() {
      _isChoosing = true;
      _dragX = choiceIndex == 0 ? -420 : 420;
      _lastChoice = card.choices[choiceIndex].text;
    });
    await Future<void>.delayed(const Duration(milliseconds: 260));
    final next = _state.copy()..day += 1;
    next.apply(card.choices[choiceIndex].effects, widget.content);
    await next.persist();
    if (!mounted) return;
    setState(() {
      _state = next;
      _cardIndex = _findNextCardIndex();
      _dragX = 0;
      _isChoosing = false;
    });
  }

  int _findNextCardIndex() {
    final count = widget.content.cards.length;
    for (var offset = 1; offset <= count; offset++) {
      final candidate = (_cardIndex + offset) % count;
      if (widget.content.cards[candidate].isAvailable(_state)) return candidate;
    }
    return _findFirstAvailableIndex();
  }

  void _resetRun() async {
    final fresh = GameState.fromContent(widget.content);
    await fresh.persist();
    if (!mounted) return;
    setState(() {
      _state = fresh;
      _cardIndex = _findFirstAvailableIndex();
      _lastChoice = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 520;
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    compact ? 18 : 28,
                    16,
                    compact ? 18 : 28,
                    10,
                  ),
                  child: Column(
                    children: [
                      _Header(state: _state, onReset: _resetRun),
                      const SizedBox(height: 14),
                      Expanded(
                        child: _CardStage(
                          card: _currentCard,
                          state: _state,
                          dragX: _dragX,
                          lastChoice: _lastChoice,
                          onDragUpdate: _onDragUpdate,
                          onDragEnd: _onDragEnd,
                          onChoice: _choose,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _StatsStrip(state: _state, content: widget.content),
                      const SizedBox(height: 9),
                      _FooterHint(card: _currentCard),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.state, required this.onReset});

  final GameState state;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'CROWN OF ASHES',
              style: TextStyle(
                color: _brass,
                fontSize: 11,
                letterSpacing: 3.2,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'THE RECORD OF A REBELLION',
              style: TextStyle(
                color: _mutedParchment.withOpacity(.72),
                fontSize: 9,
                letterSpacing: 1.6,
              ),
            ),
          ],
        ),
        const Spacer(),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'DAY ${state.day.toString().padLeft(3, '0')}',
              style: const TextStyle(
                color: _parchment,
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              displayName(state.phase),
              style: const TextStyle(
                color: _brass,
                fontSize: 10,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
        const SizedBox(width: 12),
        IconButton(
          tooltip: 'Reset run',
          onPressed: onReset,
          icon: const Icon(
            Icons.replay_rounded,
            color: _mutedParchment,
            size: 18,
          ),
        ),
      ],
    );
  }
}

class _CardStage extends StatelessWidget {
  const _CardStage({
    required this.card,
    required this.state,
    required this.dragX,
    required this.lastChoice,
    required this.onDragUpdate,
    required this.onDragEnd,
    required this.onChoice,
  });

  final GameCard card;
  final GameState state;
  final double dragX;
  final String? lastChoice;
  final ValueChanged<DragUpdateDetails> onDragUpdate;
  final ValueChanged<DragEndDetails> onDragEnd;
  final ValueChanged<int> onChoice;

  @override
  Widget build(BuildContext context) {
    final rotation = dragX / 900;
    return Column(
      children: [
        Expanded(
          child: GestureDetector(
            onHorizontalDragUpdate: onDragUpdate,
            onHorizontalDragEnd: onDragEnd,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              transform:
                  Matrix4.identity()
                    ..translate(dragX, 0)
                    ..rotateZ(rotation),
              transformAlignment: Alignment.center,
              child: _NarrativeCard(card: card, state: state),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Align(
                alignment: Alignment.centerLeft,
                child: _SwipeCue(
                  label: 'SWIPE LEFT',
                  icon: Icons.arrow_back_rounded,
                  color: _brass,
                  onTap: () => onChoice(0),
                ),
              ),
            ),
            Flexible(
              flex: 2,
              child: Text(
                lastChoice == null
                    ? 'CHOOSE YOUR CONSEQUENCE'
                    : 'THE RECORD HAS CHANGED',
                textAlign: TextAlign.center,
                maxLines: 2,
                style: TextStyle(
                  color: _mutedParchment.withOpacity(.55),
                  fontSize: 8,
                  letterSpacing: 1.1,
                ),
              ),
            ),
            Expanded(
              child: Align(
                alignment: Alignment.centerRight,
                child: _SwipeCue(
                  label: 'SWIPE RIGHT',
                  icon: Icons.arrow_forward_rounded,
                  color: _mutedParchment,
                  onTap: () => onChoice(1),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _NarrativeCard extends StatelessWidget {
  const _NarrativeCard({required this.card, required this.state});
  final GameCard card;
  final GameState state;

  @override
  Widget build(BuildContext context) => CustomPaint(
    foregroundPainter: const ReliquaryFrame(),
    child: Container(
      color: _coal,
      padding: const EdgeInsets.all(11),
      child: LayoutBuilder(
        builder: (context, constraints) {
          // Short screens scroll the whole artifact; narrative and choices never truncate.
          final height =
              constraints.maxHeight < 560 ? 560.0 : constraints.maxHeight;
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: height),
              child: Column(
                children: [
                  SizedBox(height: height * .53, child: _Artwork(card: card)),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 12, 18, 20),
                    child: _CardCopy(card: card, state: state),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    ),
  );
}

class _Artwork extends StatelessWidget {
  const _Artwork({required this.card});
  final GameCard card;
  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      Image.asset(
        card.artwork,
        fit: BoxFit.cover,
        alignment: const Alignment(0, -.35),
        errorBuilder:
            (_, __, ___) => ColoredBox(
              color: _panel,
              child: Center(
                child: Icon(
                  Icons.landscape_outlined,
                  size: 48,
                  color: _brass.withValues(alpha: .5),
                ),
              ),
            ),
      ),
      const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.transparent, Colors.transparent, _coal],
            stops: [0, .78, 1],
          ),
        ),
      ),
    ],
  );
}

class _CardCopy extends StatelessWidget {
  const _CardCopy({required this.card, required this.state});
  final GameCard card;
  final GameState state;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      Text(
        card.title.toUpperCase(),
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: _mutedParchment,
          fontSize: 12,
          letterSpacing: 1.8,
        ),
      ),
      const SizedBox(height: 12),
      Text(
        card.situation,
        textAlign: TextAlign.center,
        style: const TextStyle(color: _parchment, fontSize: 20, height: 1.32),
      ),
      const SizedBox(height: 12),
      const SizedBox(
        height: 26,
        width: double.infinity,
        child: CustomPaint(painter: ReliquaryDivider()),
      ),
      const SizedBox(height: 12),
      LayoutBuilder(
        builder: (context, constraints) {
          final choices = List.generate(
            card.choices.length.clamp(0, 2),
            (index) => _ChoiceButton(
              choice: card.choices[index],
              label: index == 0 ? 'A' : 'B',
              color: index == 0 ? _oxblood : _coal,
              state: state,
              onTap:
                  () => context
                      .findAncestorStateOfType<_GameHomeState>()
                      ?._choose(index),
            ),
          );
          if (constraints.maxWidth < 290 ||
              MediaQuery.textScalerOf(context).scale(1) > 1.3) {
            return Column(
              children: [
                for (final choice in choices)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: choice,
                  ),
              ],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < choices.length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                Expanded(child: choices[i]),
              ],
            ],
          );
        },
      ),
    ],
  );
}

class _ChoiceButton extends StatelessWidget {
  const _ChoiceButton({
    required this.choice,
    required this.label,
    required this.color,
    required this.state,
    required this.onTap,
  });
  final Choice choice;
  final String label;
  final Color color;
  final GameState state;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final enabled = choice.isAvailable(state);
    return Opacity(
      opacity: enabled ? 1 : .45,
      child: CustomPaint(
        foregroundPainter: const ReliquaryFrame(button: true),
        child: TextButton(
          onPressed: enabled ? onTap : null,
          style: ButtonStyle(
            minimumSize: const WidgetStatePropertyAll(
              Size(double.infinity, 86),
            ),
            padding: const WidgetStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            ),
            shape: const WidgetStatePropertyAll(
              BeveledRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(15)),
              ),
            ),
            backgroundColor: WidgetStatePropertyAll(
              label == 'A' ? const Color(0xFF301315) : const Color(0xFF121113),
            ),
            overlayColor: WidgetStateProperty.resolveWith(
              (states) =>
                  states.contains(WidgetState.focused)
                      ? _brass.withValues(alpha: .3)
                      : _brass.withValues(alpha: .12),
            ),
            foregroundColor: const WidgetStatePropertyAll(_parchment),
          ),
          child: Row(
            children: [
              Icon(
                label == 'A'
                    ? Icons.local_fire_department_outlined
                    : Icons.visibility_off_outlined,
                color: _brass,
                size: 25,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  choice.text,
                  style: const TextStyle(
                    fontFamily: 'EBGaramond',
                    fontSize: 17,
                    height: 1.18,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwipeCue extends StatelessWidget {
  const _SwipeCue({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => TextButton.icon(
    onPressed: onTap,
    icon: Icon(icon, color: color, size: 15),
    label: Text(
      label,
      style: TextStyle(
        color: color,
        fontFamily: 'monospace',
        fontSize: 8,
        letterSpacing: .7,
      ),
    ),
  );
}

class _StatsStrip extends StatelessWidget {
  const _StatsStrip({required this.state, required this.content});

  final GameState state;
  final ContentBundle content;

  @override
  Widget build(BuildContext context) {
    final visible = content.stats.take(4).toList();
    return Row(
      children:
          visible
              .map(
                (stat) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: _StatCell(
                      stat: stat,
                      value: state.stats[stat.id] ?? stat.value,
                    ),
                  ),
                ),
              )
              .toList(),
    );
  }
}

class _StatCell extends StatelessWidget {
  const _StatCell({required this.stat, required this.value});

  final GameStat stat;
  final int value;

  @override
  Widget build(BuildContext context) {
    final ratio = (value / stat.max).clamp(0.0, 1.0);
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 7, 8, 8),
      decoration: BoxDecoration(
        color: _coal,
        border: Border.all(color: _parchment.withOpacity(.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  stat.name.toUpperCase(),
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: _mutedParchment.withOpacity(.75),
                    fontFamily: 'monospace',
                    fontSize: 7,
                    letterSpacing: .5,
                  ),
                ),
              ),
              Text(
                '$value',
                style: const TextStyle(
                  color: _parchment,
                  fontFamily: 'monospace',
                  fontSize: 10,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              minHeight: 3,
              value: ratio,
              backgroundColor: _parchment.withOpacity(.10),
              valueColor: AlwaysStoppedAnimation<Color>(
                stat.id == 'military' ? _oxblood : _brass,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterHint extends StatelessWidget {
  const _FooterHint({required this.card});

  final GameCard card;

  @override
  Widget build(BuildContext context) => Text(
    'THE CHOICES OF TODAY ARE THE LAWS OF TOMORROW  ·  ${card.repeatable ? 'RECURRING' : 'ONE-TIME'}',
    textAlign: TextAlign.center,
    style: TextStyle(
      color: _mutedParchment.withOpacity(.46),
      fontFamily: 'monospace',
      fontSize: 7,
      letterSpacing: 1.0,
    ),
  );
}

class InkPlaceholderPainter extends CustomPainter {
  InkPlaceholderPainter({required this.title});

  final String title;

  @override
  void paint(Canvas canvas, Size size) {
    final background = Paint()..color = const Color(0xFF2B2020);
    canvas.drawRect(Offset.zero & size, background);
    final ink =
        Paint()
          ..color = const Color(0xFF5A3033)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2;
    final brass =
        Paint()
          ..color = _brass.withOpacity(.72)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.0;
    final center = Offset(size.width / 2, size.height * .45);
    for (var i = 0; i < 7; i++) {
      final rect = Rect.fromCenter(
        center: center,
        width: size.width * (.22 + i * .09),
        height: size.height * (.16 + i * .05),
      );
      canvas.drawOval(rect, i.isEven ? ink : brass);
    }
    canvas.drawLine(
      Offset(size.width * .18, size.height * .75),
      Offset(size.width * .82, size.height * .75),
      brass,
    );
    canvas.drawLine(
      Offset(size.width * .27, size.height * .18),
      Offset(size.width * .73, size.height * .18),
      brass,
    );
    final textPainter = TextPainter(
      text: TextSpan(
        text: title.toUpperCase(),
        style: const TextStyle(
          color: _parchment,
          fontFamily: 'EBGaramond',
          fontSize: 15,
          letterSpacing: 1.2,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
      maxLines: 2,
      ellipsis: '…',
    )..layout(maxWidth: size.width * .62);
    textPainter.paint(
      canvas,
      Offset((size.width - textPainter.width) / 2, size.height * .79),
    );
  }

  @override
  bool shouldRepaint(covariant InkPlaceholderPainter oldDelegate) =>
      oldDelegate.title != title;
}

class ContentRepository {
  static Future<ContentBundle> load() async {
    final raw = await rootBundle.loadString('assets/content/content.json');
    return ContentBundle.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }
}

class ContentBundle {
  ContentBundle({
    required this.schemaVersion,
    required this.contentVersion,
    required this.phases,
    required this.stats,
    required this.events,
    required this.cards,
  });

  factory ContentBundle.fromJson(Map<String, dynamic> json) => ContentBundle(
    schemaVersion: json['schemaVersion'] as int? ?? 1,
    contentVersion: json['contentVersion'] as String? ?? '0.1.0',
    phases:
        (json['phases'] as List<dynamic>? ?? [])
            .map((item) => Phase.fromJson(item as Map<String, dynamic>))
            .toList(),
    stats:
        (json['stats'] as List<dynamic>? ?? [])
            .map((item) => GameStat.fromJson(item as Map<String, dynamic>))
            .toList(),
    events:
        (json['events'] as List<dynamic>? ?? [])
            .map((item) => GameEvent.fromJson(item as Map<String, dynamic>))
            .toList(),
    cards:
        (json['cards'] as List<dynamic>? ?? [])
            .map((item) => GameCard.fromJson(item as Map<String, dynamic>))
            .toList(),
  );

  final int schemaVersion;
  final String contentVersion;
  final List<Phase> phases;
  final List<GameStat> stats;
  final List<GameEvent> events;
  final List<GameCard> cards;
}

class Phase {
  Phase({required this.id, required this.name, required this.order});
  factory Phase.fromJson(Map<String, dynamic> json) => Phase(
    id: json['id'] as String? ?? '',
    name: json['name'] as String? ?? '',
    order: json['order'] as int? ?? 0,
  );
  final String id;
  final String name;
  final int order;
}

class GameStat {
  GameStat({
    required this.id,
    required this.name,
    required this.value,
    required this.min,
    required this.max,
  });
  factory GameStat.fromJson(Map<String, dynamic> json) => GameStat(
    id: json['id'] as String? ?? '',
    name: json['name'] as String? ?? '',
    value: (json['value'] as num? ?? 0).toInt(),
    min: (json['min'] as num? ?? 0).toInt(),
    max: (json['max'] as num? ?? 100).toInt(),
  );
  final String id;
  final String name;
  final int value;
  final int min;
  final int max;
}

class GameEvent {
  GameEvent({required this.id, required this.name, required this.active});
  factory GameEvent.fromJson(Map<String, dynamic> json) => GameEvent(
    id: json['id'] as String? ?? '',
    name: json['name'] as String? ?? '',
    active: json['active'] as bool? ?? false,
  );
  final String id;
  final String name;
  final bool active;
}

class GameCard {
  GameCard({
    required this.id,
    required this.title,
    required this.artwork,
    required this.situation,
    required this.phase,
    required this.event,
    required this.dayFrom,
    required this.dayUntil,
    required this.priority,
    required this.repeatable,
    required this.choices,
  });
  factory GameCard.fromJson(Map<String, dynamic> json) => GameCard(
    id: json['id'] as String? ?? '',
    title: json['title'] as String? ?? 'Untitled card',
    artwork: json['artwork'] as String? ?? '',
    situation: json['situation'] as String? ?? '',
    phase: json['phase'] as String? ?? '',
    event: json['event'] as String?,
    dayFrom: (json['dayFrom'] as num? ?? 0).toInt(),
    dayUntil: (json['dayUntil'] as num?)?.toInt(),
    priority: (json['priority'] as num? ?? 0).toInt(),
    repeatable: json['repeatable'] as bool? ?? false,
    choices:
        (json['choices'] as List<dynamic>? ?? [])
            .map((item) => Choice.fromJson(item as Map<String, dynamic>))
            .toList(),
  );
  factory GameCard.empty() => GameCard(
    id: '',
    title: 'No eligible card',
    artwork: '',
    situation: 'The authored deck has no card available for this state.',
    phase: '',
    event: null,
    dayFrom: 0,
    dayUntil: null,
    priority: 0,
    repeatable: true,
    choices: [Choice.empty(), Choice.empty()],
  );

  final String id;
  final String title;
  final String artwork;
  final String situation;
  final String phase;
  final String? event;
  final int dayFrom;
  final int? dayUntil;
  final int priority;
  final bool repeatable;
  final List<Choice> choices;

  bool isAvailable(GameState state) =>
      phase == state.phase &&
      state.day >= dayFrom &&
      (dayUntil == null || state.day <= dayUntil!);
}

class Choice {
  Choice({
    required this.id,
    required this.text,
    required this.conditions,
    required this.effects,
  });
  factory Choice.fromJson(Map<String, dynamic> json) => Choice(
    id: json['id'] as String? ?? '',
    text: json['text'] as String? ?? '',
    conditions:
        (json['conditions'] as List<dynamic>? ?? [])
            .map((item) => Condition.fromJson(item as Map<String, dynamic>))
            .toList(),
    effects:
        (json['effects'] as List<dynamic>? ?? [])
            .map((item) => Effect.fromJson(item as Map<String, dynamic>))
            .toList(),
  );
  factory Choice.empty() =>
      Choice(id: '', text: 'No choice authored', conditions: [], effects: []);

  final String id;
  final String text;
  final List<Condition> conditions;
  final List<Effect> effects;

  bool isAvailable(GameState state) =>
      conditions.every((condition) => condition.evaluate(state));
}

class Condition {
  Condition({required this.type, this.id, this.operator, this.value});
  factory Condition.fromJson(Map<String, dynamic> json) => Condition(
    type: json['type'] as String? ?? '',
    id: json['id'] as String?,
    operator: json['operator'] as String?,
    value: json['value'],
  );

  final String type;
  final String? id;
  final String? operator;
  final dynamic value;

  bool evaluate(GameState state) {
    if (type == 'phase')
      return _compareText(
        state.phase,
        value?.toString() ?? '',
        operator ?? 'eq',
      );
    if (type == 'flag')
      return operator == 'not_exists'
          ? !state.flags.contains(value)
          : state.flags.contains(value);
    if (type == 'stat') {
      final left = state.stats[id] ?? 0;
      final right = (value as num? ?? 0).toInt();
      switch (operator) {
        case 'gt':
          return left > right;
        case 'gte':
          return left >= right;
        case 'lt':
          return left < right;
        case 'lte':
          return left <= right;
        default:
          return left == right;
      }
    }
    return true;
  }

  bool _compareText(String left, String right, String op) =>
      op == 'neq' ? left != right : left == right;
}

class Effect {
  Effect({
    required this.type,
    required this.operation,
    this.id,
    this.value,
    this.delayed,
  });
  factory Effect.fromJson(Map<String, dynamic> json) => Effect(
    type: json['type'] as String? ?? '',
    operation: json['operation'] as String? ?? 'add',
    id: json['id'] as String?,
    value: json['value'],
    delayed: (json['delayed'] as num?)?.toInt(),
  );

  final String type;
  final String operation;
  final String? id;
  final dynamic value;
  final int? delayed;
}

class GameState {
  GameState({
    required this.phase,
    required this.day,
    required this.stats,
    required this.flags,
    required this.activeEvents,
  });

  factory GameState.fromContent(ContentBundle content) => GameState(
    phase: content.phases.isEmpty ? 'rebellion' : content.phases.first.id,
    day: 1,
    stats: {for (final stat in content.stats) stat.id: stat.value},
    flags: {},
    activeEvents: {
      for (final event in content.events.where((event) => event.active))
        event.id,
    },
  );

  factory GameState.fromJson(Map<String, dynamic> json) => GameState(
    phase: json['phase'] as String? ?? 'rebellion',
    day: (json['day'] as num? ?? 1).toInt(),
    stats: Map<String, dynamic>.from(
      json['stats'] as Map? ?? {},
    ).map((key, value) => MapEntry(key, (value as num).toInt())),
    flags: Set<String>.from(
      (json['flags'] as List<dynamic>? ?? []).map((item) => item.toString()),
    ),
    activeEvents: Set<String>.from(
      (json['activeEvents'] as List<dynamic>? ?? []).map(
        (item) => item.toString(),
      ),
    ),
  );

  String phase;
  int day;
  Map<String, int> stats;
  Set<String> flags;
  Set<String> activeEvents;

  GameState copy() => GameState(
    phase: phase,
    day: day,
    stats: Map<String, int>.from(stats),
    flags: Set<String>.from(flags),
    activeEvents: Set<String>.from(activeEvents),
  );

  void apply(List<Effect> effects, ContentBundle content) {
    for (final effect in effects) {
      if (effect.delayed != null) continue;
      if (effect.type == 'stat') {
        final statId = effect.id ?? '';
        final before = stats[statId] ?? 0;
        final amount = (effect.value as num? ?? 0).toInt();
        final stat = content.stats.firstWhere(
          (item) => item.id == statId,
          orElse:
              () => GameStat(
                id: statId,
                name: statId,
                value: 0,
                min: 0,
                max: 100,
              ),
        );
        stats[statId] =
            (effect.operation == 'set'
                    ? amount.clamp(stat.min, stat.max)
                    : (before + amount).clamp(stat.min, stat.max))
                .toInt();
      } else if (effect.type == 'flag') {
        if (effect.operation == 'set')
          flags.add(effect.value?.toString() ?? '');
        if (effect.operation == 'remove')
          flags.remove(effect.value?.toString() ?? '');
      } else if (effect.type == 'event') {
        if (effect.operation == 'start')
          activeEvents.add(effect.value?.toString() ?? '');
        if (effect.operation == 'end')
          activeEvents.remove(effect.value?.toString() ?? '');
      } else if (effect.type == 'phase' && effect.operation == 'change') {
        phase = effect.value?.toString() ?? phase;
      } else if (effect.type == 'time') {
        day =
            effect.operation == 'set'
                ? (effect.value as num? ?? day).toInt()
                : day + (effect.value as num? ?? 0).toInt();
      }
    }
  }

  Map<String, dynamic> toJson() => {
    'phase': phase,
    'day': day,
    'stats': stats,
    'flags': flags.toList(),
    'activeEvents': activeEvents.toList(),
  };

  static Future<GameState> load(ContentBundle content) async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString('coa-game-state');
    if (raw == null) return GameState.fromContent(content);
    try {
      return GameState.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return GameState.fromContent(content);
    }
  }

  Future<void> persist() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString('coa-game-state', jsonEncode(toJson()));
  }
}

String displayName(String id) => id
    .replaceAll('_', ' ')
    .split(' ')
    .map(
      (word) =>
          word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}',
    )
    .join(' ');

