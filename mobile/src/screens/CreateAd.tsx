import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  Box,
  Checkbox,
  FlatList,
  Flex,
  FormControl,
  HStack,
  Image,
  KeyboardAvoidingView,
  Radio,
  ScrollView,
  Switch,
  Text,
  TextArea,
  VStack,
  useToast,
} from "native-base";
import { ArrowLeft, Plus, X } from "phosphor-react-native";
import { useEffect, useLayoutEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SafeAreaView, TouchableOpacity } from "react-native";
import * as yup from "yup";
import Button from "../components/Button";
import Input from "../components/Input";
import Loading from "../components/Loading";
import { AppNavigationProps } from "../routes/app.routes";
import api from "../services/api";

type PhotoFileProps = {
  uri: string;
  type: string;
  name: string;
  id?: string; // id is only used when editing an ad
  path?: string; // path is only used when editing an ad
};

type FormDataProps = {
  product_images?: PhotoFileProps[];
  name: string;
  description: string;
  is_new: string;
  price: number;
  accept_trade: boolean;
  payment_methods: string[];
};

const createAdSchema = yup.object({
  name: yup.string().required("O nome do produto é obrigatório"),
  description: yup.string().required("A descrição do produto é obrigatória"),
  is_new: yup.string().required("É obrigatório informar o estado do produto"),
  price: yup
    .number()
    .required("O preço do produto é obrigatório")
    .typeError("O preço do produto é obrigatório") // pice must be a `number` type, but the final value was: `NaN` (cast from the value `""`)
    .moreThan(0, "O preço do produto deve ser maior que 0"),
  accept_trade: yup
    .boolean()
    .required("É obrigatório informar se aceita troca"),
  payment_methods: yup
    .array()
    .min(1, "É obrigatório informar os meios de pagamento aceitos")
    .required("É obrigatório informar os meios de pagamento aceitos"),
});

export default function CreateAd() {
  const toast = useToast();
  const { params } = useRoute();
  const navigation = useNavigation<AppNavigationProps>();
  const [product, setProduct] = useState({});
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormDataProps>({
    defaultValues: {
      name: "",
      description: "",
      is_new: "",
      accept_trade: false,
      payment_methods: [],
    },
    resolver: yupResolver(createAdSchema),
  });
  const [images, setImages] = useState<PhotoFileProps[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // only used when editing an ad
  const [loadingData, setIsLoadingData] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: params ? "Editar anúncio" : "Criar anúncio",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1A181B" />
        </TouchableOpacity>
      ),
    });
  }, []);

  async function handleProductsImages() {
    try {
      const photosSelected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
        orderedSelection: true,
      });

      if (photosSelected.canceled) return;

      if (photosSelected.assets) {
        const newSelectedPhotos = photosSelected.assets.map((photo) => {
          const filesExtension = photo.uri.split(".").pop();

          const photoFile = {
            uri: photo.uri,
            type: `${photo.type}/${filesExtension}`,
            name: `${Date.now()}.${filesExtension}`,
          };

          return photoFile;
        });

        setImages((prevSelectedPhotos) => [
          ...prevSelectedPhotos,
          ...newSelectedPhotos,
        ]);
      }
    } catch (error) {
      toast.show({
        title: "Por favor selecione outra imagem",
        bgColor: "red.400",
      });

      console.log("error on handleProductsImages:", error);
    }
  }

  function handleRemoveImage(image: PhotoFileProps) {
    try {
      image.uri
        ? setImages((prevImages) =>
            prevImages.filter((img) => img.uri !== image.uri)
          )
        : (setImages((prevImages) =>
            prevImages.filter((img) => img.path !== image.path)
          ),
          setImagesToDelete((prevImages) => [
            ...prevImages,
            image.id as string,
          ]));
    } catch (error) {
      console.log("error on handleRemoveImage:", error);
    }
  }

  function handlePreVisualization({
    name,
    description,
    is_new,
    price,
    accept_trade,
    payment_methods,
  }: FormDataProps) {
    try {
      if (!params && images.length < 1) {
        return toast.show({
          title: "Selecione pelo menos uma imagem",
        });
      }

      navigation.navigate("prePublish", {
        product_id: params?.product_id,
        product_images: images,
        name,
        description,
        is_new,
        price,
        accept_trade,
        payment_methods,
        imagesToDelete,
      });
    } catch (error) {
      console.log("error on handlePreVisualization:", error);
    }
  }

  async function getProductData() {
    try {
      setIsLoadingData(true);

      const { data } = await api.get(`/products/${params?.product_id}`);

      setProduct(data);
      setImages(data.product_images);
      reset({
        name: data.name,
        description: data.description,
        is_new: data.is_new ? "new" : "used",
        price: data.price.toString(),
        accept_trade: data.accept_trade,
        payment_methods: data.payment_methods.map((item) => item.key),
      });
    } catch (error) {
      console.log("error on getProductData:", error);
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    if (params) {
      getProductData();
    }
  }, []);

  console.log("product:", product);

  return loadingData ? (
    <Loading />
  ) : (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EDECEE" }}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <KeyboardAvoidingView style={{ flex: 1 }}>
            <VStack px={6} mt={3}>
              <Text fontFamily="heading" fontSize="md" color="gray.600" mb={1}>
                Imagens
              </Text>
              <Text fontFamily="body" color="gray.500" mb={4}>
                Escolha até 3 imagens para mostrar o quando o seu produto é
                incrível!
              </Text>
            </VStack>

            <Flex flexDirection="row" alignItems="center" mb={8}>
              <FlatList
                data={images}
                keyExtractor={(item) => item.id || item.uri}
                showsHorizontalScrollIndicator={false}
                horizontal
                renderItem={({ item }) => (
                  <Box>
                    <Image
                      source={{
                        uri: item.uri
                          ? item.uri
                          : `${api.defaults.baseURL}/images/${item.path}`,
                      }}
                      h={100}
                      w={100}
                      rounded="md"
                      alt="item"
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#3E3A40",
                        borderRadius: 99,
                        position: "absolute",
                        padding: 2,
                        top: 4,
                        right: 4,
                      }}
                      activeOpacity={0.4}
                      hitSlop={20}
                      onPress={() => handleRemoveImage(item)}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </Box>
                )}
                contentContainerStyle={{
                  gap: 8,
                  paddingHorizontal: 24,
                }}
                ListFooterComponent={() => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#D9D8DA",
                      display: images.length > 2 ? "none" : "flex",
                    }}
                    onPress={handleProductsImages}
                    disabled={images.length > 2}
                  >
                    <Plus size={24} color="#9F9BA1" />
                  </TouchableOpacity>
                )}
              />
            </Flex>

            <VStack px={6} space={4}>
              <Text
                fontFamily="heading"
                fontSize="md"
                color="gray.600"
                lineHeight="2xs"
                mb={1}
              >
                Sobre o produto
              </Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="Título do anúncio"
                    value={value}
                    onChangeText={onChange}
                    errorMessage={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <FormControl isInvalid={!!errors.description?.message}>
                    <TextArea
                      placeholder="Descrição do produto"
                      autoCompleteType={true}
                      py={3}
                      px={4}
                      h={160}
                      bg="gray.100"
                      rounded={6}
                      borderWidth={0}
                      fontSize="md"
                      fontFamily="body"
                      placeholderTextColor="gray.400"
                      color="gray.600"
                      _focus={{
                        bg: "gray.100",
                      }}
                      value={value}
                      onChangeText={onChange}
                      maxLength={300}
                    />
                    <FormControl.ErrorMessage _text={{ color: "red.400" }}>
                      {errors.description?.message}
                    </FormControl.ErrorMessage>
                  </FormControl>
                )}
              />

              <Controller
                control={control}
                name="is_new"
                render={({ field: { onChange, value } }) => (
                  <FormControl isInvalid={!!errors.is_new?.message}>
                    <Radio.Group
                      name="productName"
                      onChange={onChange}
                      // onChange={(nextValue) => onChange(nextValue)}
                      value={value}
                      flexDirection="row"
                      alignContent="center"
                      style={{
                        gap: 24,
                      }}
                    >
                      <Radio
                        value="new"
                        bg="gray.200"
                        _checked={{
                          borderColor: "blue.400",
                        }}
                        _icon={{
                          color: "blue.400",
                        }}
                      >
                        <Text fontFamily="body" fontSize="md" color="gray.600">
                          Produto novo
                        </Text>
                      </Radio>

                      <Radio
                        value="used"
                        bg="gray.200"
                        _checked={{
                          borderColor: "blue.400",
                        }}
                        _icon={{
                          color: "blue.400",
                        }}
                      >
                        <Text fontFamily="body" fontSize="md" color="gray.600">
                          Produto usado
                        </Text>
                      </Radio>
                    </Radio.Group>

                    <FormControl.ErrorMessage _text={{ color: "red.400" }}>
                      {errors.is_new?.message}
                    </FormControl.ErrorMessage>
                  </FormControl>
                )}
              />
            </VStack>

            <VStack px={6} space={4} mt={8}>
              <Text
                fontFamily="heading"
                fontSize="md"
                lineHeight="2xs"
                color="gray.600"
                mb={1}
              >
                Venda
              </Text>

              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="Valor do produto"
                    keyboardType="decimal-pad"
                    InputLeftElement={
                      <Text
                        fontSize="md"
                        color="gray.700"
                        fontFamily="body"
                        ml={4}
                      >
                        R$
                      </Text>
                    }
                    px={0}
                    pl={2}
                    value={value}
                    onChangeText={onChange}
                    errorMessage={errors.price?.message}
                  />
                )}
              />
            </VStack>

            <VStack px={6} mt={4} mb={7}>
              <Text fontFamily="heading" color="gray.600" mb={3}>
                Aceita troca?
              </Text>
              <Controller
                control={control}
                name="accept_trade"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    size="md"
                    offTrackColor="gray.300"
                    onTrackColor="blue.400"
                    mb={4}
                    value={value}
                    onToggle={onChange}
                  />
                )}
              />

              <Text fontFamily="heading" color="gray.600" mb={3}>
                Meios de pagamento aceitos
              </Text>
              <VStack space={2}>
                <Controller
                  control={control}
                  name="payment_methods"
                  render={({ field: { onChange, value } }) => (
                    <FormControl isInvalid={!!errors.payment_methods?.message}>
                      <Checkbox.Group
                        // onChange={setGroupValues}
                        // value={groupValues}
                        onChange={onChange}
                        value={value}
                      >
                        <Checkbox
                          value="boleto"
                          _checked={{
                            bg: "blue.400",
                            borderColor: "blue.400",
                          }}
                          borderColor="gray.300"
                        >
                          <Text
                            fontFamily="body"
                            fontSize="md"
                            color="gray.600"
                          >
                            Boleto
                          </Text>
                        </Checkbox>

                        <Checkbox
                          value="pix"
                          _checked={{
                            bg: "blue.400",
                            borderColor: "blue.400",
                          }}
                          borderColor="gray.300"
                        >
                          <Text
                            fontFamily="body"
                            fontSize="md"
                            color="gray.600"
                          >
                            Pix
                          </Text>
                        </Checkbox>

                        <Checkbox
                          value="cash"
                          _checked={{
                            bg: "blue.400",
                            borderColor: "blue.400",
                          }}
                          borderColor="gray.300"
                        >
                          <Text
                            fontFamily="body"
                            fontSize="md"
                            color="gray.600"
                          >
                            Dinheiro
                          </Text>
                        </Checkbox>

                        <Checkbox
                          value="card"
                          _checked={{
                            bg: "blue.400",
                            borderColor: "blue.400",
                          }}
                          borderColor="gray.300"
                        >
                          <Text
                            fontFamily="body"
                            fontSize="md"
                            color="gray.600"
                          >
                            Cartão de Crédito
                          </Text>
                        </Checkbox>

                        <Checkbox
                          value="deposit"
                          _checked={{
                            bg: "blue.400",
                            borderColor: "blue.400",
                          }}
                          borderColor="gray.300"
                        >
                          <Text
                            fontFamily="body"
                            fontSize="md"
                            color="gray.600"
                          >
                            Depósito Bancário
                          </Text>
                        </Checkbox>
                      </Checkbox.Group>

                      <FormControl.ErrorMessage _text={{ color: "red.400" }}>
                        {errors.payment_methods?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>
                  )}
                />
              </VStack>
            </VStack>

            <Box pt={5} px={6} pb={3} bg="gray.100" w="full">
              <HStack space={3}>
                <Button title="Cancelar" onPress={() => navigation.goBack()} />

                <Button
                  title="Avançar"
                  variant="dark"
                  onPress={handleSubmit(handlePreVisualization)}
                />
              </HStack>
            </Box>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={{ flex: 0, backgroundColor: "#F7F7F8" }} />
    </>
  );
}
