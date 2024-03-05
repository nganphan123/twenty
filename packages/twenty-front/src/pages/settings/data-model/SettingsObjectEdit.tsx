import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useObjectMetadataItemForSettings } from '@/object-metadata/hooks/useObjectMetadataItemForSettings';
import { useUpdateOneObjectMetadataItem } from '@/object-metadata/hooks/useUpdateOneObjectMetadataItem';
import { getObjectSlug } from '@/object-metadata/utils/getObjectSlug';
import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsHeaderContainer } from '@/settings/components/SettingsHeaderContainer';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsObjectFormSection } from '@/settings/data-model/components/SettingsObjectFormSection';
import { SettingsDataModelObjectSettingsFormCard } from '@/settings/data-model/objects/forms/components/SettingsDataModelObjectSettingsFormCard';
import { settingsUpdateObjectInputSchema } from '@/settings/data-model/validation-schemas/settingsUpdateObjectInputSchema';
import { getSettingsPagePath } from '@/settings/utils/getSettingsPagePath';
import { AppPath } from '@/types/AppPath';
import { SettingsPath } from '@/types/SettingsPath';
import { IconArchive, IconSettings } from '@/ui/display/icon';
import { H2Title } from '@/ui/display/typography/components/H2Title';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from '@/ui/input/button/components/Button';
import { SubMenuTopBarContainer } from '@/ui/layout/page/SubMenuTopBarContainer';
import { Section } from '@/ui/layout/section/components/Section';
import { Breadcrumb } from '@/ui/navigation/bread-crumb/components/Breadcrumb';

export const SettingsObjectEdit = () => {
  const navigate = useNavigate();
  const { enqueueSnackBar } = useSnackBar();

  const { objectSlug = '' } = useParams();
  const { findActiveObjectMetadataItemBySlug } =
    useObjectMetadataItemForSettings();
  const { updateOneObjectMetadataItem } = useUpdateOneObjectMetadataItem();

  const activeObjectMetadataItem =
    findActiveObjectMetadataItemBySlug(objectSlug);

  const [formValues, setFormValues] = useState<
    Partial<{
      icon: string;
      labelSingular: string;
      labelPlural: string;
      description: string;
    }>
  >({});

  useEffect(() => {
    if (!activeObjectMetadataItem) {
      navigate(AppPath.NotFound);
      return;
    }

    if (!Object.keys(formValues).length) {
      setFormValues({
        icon: activeObjectMetadataItem.icon ?? undefined,
        labelSingular: activeObjectMetadataItem.labelSingular,
        labelPlural: activeObjectMetadataItem.labelPlural,
        description: activeObjectMetadataItem.description ?? undefined,
      });
    }
  }, [activeObjectMetadataItem, formValues, navigate]);

  if (!activeObjectMetadataItem) return null;

  const areRequiredFieldsFilled =
    !!formValues.labelSingular && !!formValues.labelPlural;

  const hasChanges =
    formValues.description !== activeObjectMetadataItem.description ||
    formValues.icon !== activeObjectMetadataItem.icon ||
    formValues.labelPlural !== activeObjectMetadataItem.labelPlural ||
    formValues.labelSingular !== activeObjectMetadataItem.labelSingular;

  const canSave = areRequiredFieldsFilled && hasChanges;

  const handleSave = async () => {
    const editedObjectMetadataItem = {
      ...activeObjectMetadataItem,
      ...formValues,
    };

    try {
      await updateOneObjectMetadataItem({
        idToUpdate: activeObjectMetadataItem.id,
        updatePayload: settingsUpdateObjectInputSchema.parse(formValues),
      });

      navigate(`/settings/objects/${getObjectSlug(editedObjectMetadataItem)}`);
    } catch (error) {
      enqueueSnackBar((error as Error).message, {
        variant: 'error',
      });
    }
  };

  const handleDisable = async () => {
    await updateOneObjectMetadataItem({
      idToUpdate: activeObjectMetadataItem.id,
      updatePayload: { isActive: false },
    });
    navigate(getSettingsPagePath(SettingsPath.Objects));
  };

  return (
    <SubMenuTopBarContainer Icon={IconSettings} title="Settings">
      <SettingsPageContainer>
        <SettingsHeaderContainer>
          <Breadcrumb
            links={[
              { children: 'Objects', href: '/settings/objects' },
              {
                children: activeObjectMetadataItem.labelPlural,
                href: `/settings/objects/${objectSlug}`,
              },
              { children: 'Edit' },
            ]}
          />
          {activeObjectMetadataItem.isCustom && (
            <SaveAndCancelButtons
              isSaveDisabled={!canSave}
              onCancel={() => navigate(`/settings/objects/${objectSlug}`)}
              onSave={handleSave}
            />
          )}
        </SettingsHeaderContainer>
        <SettingsObjectFormSection
          disabled={!activeObjectMetadataItem.isCustom}
          icon={formValues.icon}
          singularName={formValues.labelSingular}
          pluralName={formValues.labelPlural}
          description={formValues.description}
          onChange={(values) =>
            setFormValues((previousFormValues) => ({
              ...previousFormValues,
              ...values,
            }))
          }
        />
        <Section>
          <H2Title
            title="Settings"
            description="Choose the fields that will identify your records"
          />
          <SettingsDataModelObjectSettingsFormCard
            objectMetadataItem={activeObjectMetadataItem}
          />
        </Section>
        <Section>
          <H2Title title="Danger zone" description="Disable object" />
          <Button
            Icon={IconArchive}
            title="Disable"
            size="small"
            onClick={handleDisable}
          />
        </Section>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
