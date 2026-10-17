<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ui } from '@/lib/ui'

type Variant = 'primary' | 'secondary' | 'onDark' | 'outlineOnDark' | 'pill' | 'pillLight' | 'link'

const props = withDefaults(
  defineProps<{
    to?: string
    href?: string
    variant?: Variant
    type?: 'button' | 'submit' | 'reset'
    block?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', block: false, disabled: false },
)

const variantClass: Record<Variant, string> = {
  primary: ui.btnPrimary,
  secondary: ui.btnSecondary,
  onDark: ui.btnOnDark,
  outlineOnDark: ui.btnOutlineOnDark,
  pill: ui.btnPill,
  pillLight: ui.btnPillLight,
  link: ui.linkEmerald,
}

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const external = computed(() => !!props.href && /^https?:/i.test(props.href))
const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: external.value ? '_blank' : undefined, rel: external.value ? 'noopener noreferrer' : undefined }
  return { type: props.type, disabled: props.disabled }
})
</script>

<template>
  <component :is="tag" v-bind="attrs" :class="[variantClass[variant], block && 'w-full']">
    <slot />
  </component>
</template>
