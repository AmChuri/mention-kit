import { computed, defineComponent, h, ref } from 'vue';
import { useMentionEditor } from '@cursortag/mention-kit/vue';
import { USERS } from '../data';

type Team = 'all' | 'eng' | 'design' | 'product';

export const VueComposableApp = defineComponent({
  name: 'VueComposableApp',
  setup() {
    const team = ref<Team>('all');
    const output = ref('');

    const filteredUsers = computed(() => {
      if (team.value === 'eng')
        return USERS.filter((u) => u.meta === 'Engineering');
      if (team.value === 'design')
        return USERS.filter((u) => u.meta === 'Design');
      if (team.value === 'product')
        return USERS.filter((u) => u.meta === 'Product');
      return USERS;
    });

    // Reactive getter — the editor always reads the latest computed list
    const editor = useMentionEditor({
      get users() {
        return filteredUsers.value;
      },
      onSubmit: (text: string) => {
        output.value = text;
        editor.clear();
      },
      placeholder: 'Write a comment… (type @ to mention)',
    });

    const teams: { value: Team; label: string }[] = [
      { value: 'all', label: 'All' },
      { value: 'eng', label: 'Engineering' },
      { value: 'design', label: 'Design' },
      { value: 'product', label: 'Product' },
    ];

    return () =>
      h('div', { class: 'demo-live' }, [
        // Filter toolbar
        h('div', { class: 'demo-filter-bar' }, [
          h('span', { class: 'filter-label' }, '@-mentions:'),
          ...teams.map((t) =>
            h(
              'button',
              {
                class: ['btn-filter', team.value === t.value ? 'active' : ''],
                onClick: () => {
                  team.value = t.value;
                },
              },
              t.label,
            ),
          ),
        ]),
        // Editor surface — containerRef attaches here
        h('div', { ref: editor.containerRef, class: 'demo-editor' }),
        h('div', { class: 'demo-actions' }, [
          h(
            'button',
            { class: 'btn-ghost', onClick: () => editor.clear() },
            'Clear',
          ),
          h(
            'button',
            { class: 'btn-ghost', onClick: () => editor.focus() },
            'Focus',
          ),
        ]),
        output.value
          ? h('div', { class: 'demo-output' }, [
              h('span', { class: 'output-label' }, 'submitted'),
              h('code', output.value),
            ])
          : null,
      ]);
  },
});
